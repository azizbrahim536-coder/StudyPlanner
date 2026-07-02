import json
import os
import re
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google import genai
from pydantic import BaseModel, ValidationError


# =========================================================
# Configuration
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-2.5-flash"
)

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY est introuvable. "
        "Vérifiez le fichier service.ia/.env."
    )

client = genai.Client(
    api_key=GEMINI_API_KEY
)

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:4200",
                "http://127.0.0.1:4200"
            ]
        }
    }
)


# =========================================================
# Modèles Pydantic
# =========================================================

class GeneratedTask(BaseModel):
    title: str
    description: str = ""
    studyDate: str
    durationMinutes: int
    priority: Literal[
        "LOW",
        "MEDIUM",
        "HIGH"
    ]


class GeneratedPlan(BaseModel):
    tasks: list[GeneratedTask]


# =========================================================
# Schéma JSON envoyé à Gemini
# =========================================================

PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "tasks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description":
                            "Titre clair de la séance en français."
                    },
                    "description": {
                        "type": "string",
                        "description":
                            "Description précise des éléments à étudier."
                    },
                    "studyDate": {
                        "type": "string",
                        "description":
                            "Date au format YYYY-MM-DD."
                    },
                    "durationMinutes": {
                        "type": "integer",
                        "description":
                            "Durée de la séance entre 15 et 180 minutes."
                    },
                    "priority": {
                        "type": "string",
                        "enum": [
                            "LOW",
                            "MEDIUM",
                            "HIGH"
                        ]
                    }
                },
                "required": [
                    "title",
                    "description",
                    "studyDate",
                    "durationMinutes",
                    "priority"
                ]
            }
        }
    },
    "required": [
        "tasks"
    ]
}


# =========================================================
# Fonctions utilitaires
# =========================================================

def normalize_chapters(value) -> list[str]:
    """
    Transforme une liste ou un texte séparé par
    des virgules, points-virgules ou nouvelles lignes
    en liste de chapitres.
    """

    if isinstance(value, list):
        return [
            str(chapter).strip()
            for chapter in value
            if str(chapter).strip()
        ]

    if isinstance(value, str):
        return [
            chapter.strip()
            for chapter in re.split(
                r"[\n,;]+",
                value
            )
            if chapter.strip()
        ]

    return []


def parse_preferred_time(value: str) -> tuple[int, int]:
    """
    Accepte HH:mm ou HH:mm:ss.
    Retourne l'heure et les minutes.
    """

    clean_value = value.strip()

    for time_format in (
        "%H:%M",
        "%H:%M:%S"
    ):
        try:
            parsed = datetime.strptime(
                clean_value,
                time_format
            )

            return parsed.hour, parsed.minute

        except ValueError:
            continue

    raise ValueError(
        "L'heure préférée doit être au format HH:mm."
    )


def parse_json_response(text: str) -> dict:
    """
    Convertit la réponse Gemini en JSON.
    Supprime aussi les éventuelles balises Markdown.
    """

    clean_text = text.strip()

    if clean_text.startswith("```"):
        clean_text = re.sub(
            r"^```(?:json)?\s*",
            "",
            clean_text,
            flags=re.IGNORECASE
        )

        clean_text = re.sub(
            r"\s*```$",
            "",
            clean_text
        )

    return json.loads(clean_text)


def create_prompt(
    subject: str,
    exam_date: date,
    chapters: list[str],
    daily_minutes: int,
    preferred_start_time: str,
    difficulty: str
) -> str:

    today = date.today()

    chapters_text = "\n".join(
        f"- {chapter}"
        for chapter in chapters
    )

    maximum_tasks = min(
        30,
        max(
            len(chapters),
            len(chapters) * 2 + 2
        )
    )

    return f"""
Tu es un assistant expert en organisation des études.

Génère un planning d'étude réaliste et progressif en français.

Informations de l'étudiant :
- Date actuelle : {today.isoformat()}
- Matière : {subject}
- Date de l'examen : {exam_date.isoformat()}
- Temps disponible par jour : {daily_minutes} minutes
- Heure préférée de début : {preferred_start_time}
- Niveau de difficulté : {difficulty}

Chapitres à étudier :
{chapters_text}

Règles obligatoires :
- Planifie les séances entre {today.isoformat()}
  et la veille de l'examen.
- Couvre tous les chapitres.
- Ne crée pas plus de {maximum_tasks} séances.
- Ne dépasse pas {daily_minutes} minutes de travail par jour.
- Chaque séance doit durer entre 15 et 180 minutes.
- Répartis les séances sur plusieurs jours lorsque cela est possible.
- Commence par les chapitres importants ou difficiles.
- Ajoute une révision générale avant l'examen si le temps le permet.
- Ne crée aucune tâche en double.
- Utilise uniquement LOW, MEDIUM ou HIGH pour priority.
- Utilise le format YYYY-MM-DD pour studyDate.
- Les titres et descriptions doivent être en français.
- Retourne uniquement les données correspondant au schéma JSON.
"""


def generate_start_time(
    preferred_hour: int,
    preferred_minute: int,
    used_minutes: int
) -> str:
    """
    Calcule automatiquement l'heure de début de chaque
    séance afin d'éviter les chevauchements.
    """

    total_minutes = (
        preferred_hour * 60
        + preferred_minute
        + used_minutes
    )

    hour = total_minutes // 60
    minute = total_minutes % 60

    return f"{hour:02d}:{minute:02d}:00"


# =========================================================
# Routes
# =========================================================

@app.get("/api/ai/health")
def health():
    return jsonify({
        "status": "Study Planner AI service is running",
        "model": GEMINI_MODEL
    }), 200


@app.post("/api/ai/generate-study-plan")
def generate_study_plan():
    try:
        data = request.get_json(
            silent=True
        ) or {}

        subject = str(
            data.get("subject", "")
        ).strip()

        exam_date_value = str(
            data.get("examDate", "")
        ).strip()

        chapters = normalize_chapters(
            data.get("chapters", [])
        )

        preferred_start_time = str(
            data.get(
                "preferredStartTime",
                "18:00"
            )
        ).strip()

        difficulty = str(
            data.get(
                "difficulty",
                "MEDIUM"
            )
        ).strip().upper()

        # ---------------------------------------------
        # Validation des données entrantes
        # ---------------------------------------------

        if not subject:
            return jsonify({
                "message":
                    "La matière est obligatoire."
            }), 400

        if len(subject) > 100:
            return jsonify({
                "message":
                    "La matière ne doit pas dépasser "
                    "100 caractères."
            }), 400

        if not chapters:
            return jsonify({
                "message":
                    "Ajoutez au moins un chapitre."
            }), 400

        if len(chapters) > 30:
            return jsonify({
                "message":
                    "Vous ne pouvez pas dépasser "
                    "30 chapitres."
            }), 400

        try:
            available_hours = float(
                data.get(
                    "availableHoursPerDay",
                    2
                )
            )

        except (
            TypeError,
            ValueError
        ):
            return jsonify({
                "message":
                    "Le nombre d'heures disponibles "
                    "est invalide."
            }), 400

        if not 0.5 <= available_hours <= 8:
            return jsonify({
                "message":
                    "Les heures disponibles doivent être "
                    "comprises entre 0.5 et 8 heures."
            }), 400

        if difficulty not in {
            "EASY",
            "MEDIUM",
            "HARD"
        }:
            return jsonify({
                "message":
                    "Le niveau de difficulté est invalide."
            }), 400

        try:
            exam_date = date.fromisoformat(
                exam_date_value
            )

        except ValueError:
            return jsonify({
                "message":
                    "La date de l'examen est invalide."
            }), 400

        today = date.today()

        if exam_date <= today:
            return jsonify({
                "message":
                    "La date de l'examen doit être future."
            }), 400

        try:
            preferred_hour, preferred_minute = (
                parse_preferred_time(
                    preferred_start_time
                )
            )

        except ValueError as error:
            return jsonify({
                "message": str(error)
            }), 400

        daily_minutes = int(
            available_hours * 60
        )

        preferred_total_minutes = (
            preferred_hour * 60
            + preferred_minute
        )

        if (
            preferred_total_minutes
            + daily_minutes
            > 24 * 60
        ):
            return jsonify({
                "message":
                    "L'heure choisie est trop tardive "
                    "pour le nombre d'heures disponibles."
            }), 400

        # ---------------------------------------------
        # Appel Gemini
        # ---------------------------------------------

        prompt = create_prompt(
            subject=subject,
            exam_date=exam_date,
            chapters=chapters,
            daily_minutes=daily_minutes,
            preferred_start_time=preferred_start_time,
            difficulty=difficulty
        )

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config={
                "response_mime_type":
                    "application/json",

                "response_json_schema":
                    PLAN_SCHEMA,

                "temperature":
                    0.2,

                "max_output_tokens":
                    8192
            }
        )

        if not response.text:
            return jsonify({
                "message":
                    "Gemini n'a retourné aucun planning."
            }), 502

        # ---------------------------------------------
        # Lecture et validation de la réponse
        # ---------------------------------------------

        response_data = parse_json_response(
            response.text
        )

        generated_plan = (
            GeneratedPlan.model_validate(
                response_data
            )
        )

        # ---------------------------------------------
        # Nettoyage du planning
        # ---------------------------------------------

        accepted_tasks = []

        used_minutes_by_date: dict[
            str,
            int
        ] = defaultdict(int)

        seen_tasks: set[
            tuple[str, str]
        ] = set()

        sorted_tasks = sorted(
            generated_plan.tasks,
            key=lambda task: (
                task.studyDate,
                task.title.lower()
            )
        )

        for generated_task in sorted_tasks:

            title = generated_task.title.strip()[
                :150
            ]

            description = (
                generated_task.description.strip()[
                    :3000
                ]
            )

            if len(title) < 3:
                continue

            try:
                task_date = date.fromisoformat(
                    generated_task.studyDate
                )

            except ValueError:
                continue

            if not today <= task_date < exam_date:
                continue

            duration = int(
                generated_task.durationMinutes
            )

            duration = max(
                15,
                min(
                    duration,
                    180,
                    daily_minutes
                )
            )

            current_used_minutes = (
                used_minutes_by_date[
                    generated_task.studyDate
                ]
            )

            if (
                current_used_minutes
                + duration
                > daily_minutes
            ):
                continue

            duplicate_key = (
                title.lower(),
                generated_task.studyDate
            )

            if duplicate_key in seen_tasks:
                continue

            start_time = generate_start_time(
                preferred_hour,
                preferred_minute,
                current_used_minutes
            )

            priority = (
                generated_task.priority
                if generated_task.priority in {
                    "LOW",
                    "MEDIUM",
                    "HIGH"
                }
                else "MEDIUM"
            )

            accepted_tasks.append({
                "title": title,
                "description": description,
                "subject": subject,
                "studyDate":
                    generated_task.studyDate,
                "startTime": start_time,
                "durationMinutes": duration,
                "priority": priority,
                "status": "TODO"
            })

            seen_tasks.add(
                duplicate_key
            )

            used_minutes_by_date[
                generated_task.studyDate
            ] += duration

        if not accepted_tasks:
            return jsonify({
                "message":
                    "L'IA n'a produit aucune tâche valide. "
                    "Essayez avec une date d'examen "
                    "plus éloignée."
            }), 502

        return jsonify({
            "subject": subject,
            "examDate": exam_date.isoformat(),
            "taskCount": len(
                accepted_tasks
            ),
            "tasks": accepted_tasks
        }), 200

    except ValidationError as error:
        app.logger.exception(
            "Réponse Gemini invalide"
        )

        return jsonify({
            "message":
                "Le planning généré ne respecte pas "
                "le format attendu.",
            "details":
                error.errors()
        }), 502

    except json.JSONDecodeError as error:
        app.logger.exception(
            "Réponse Gemini non JSON"
        )

        return jsonify({
            "message":
                "Gemini a retourné une réponse JSON invalide.",
            "details":
                str(error)
        }), 502

    except Exception as error:
        app.logger.exception(
            "Erreur pendant la génération du planning"
        )

        return jsonify({
            "message":
                "Impossible de générer le planning.",
            "details":
                str(error)
        }), 500


# =========================================================
# Démarrage
# =========================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )