import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "EV Charging Station Management & Software Metrics"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/evcharging"
    )
    
    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-ev-charging-2026-production-grade")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SonarQube Cloud Defaults
    SONARQUBE_URL: str = os.getenv("SONARQUBE_URL", "https://sonarcloud.io")
    SONARQUBE_PROJECT_KEY: str = os.getenv("SONARQUBE_PROJECT_KEY", "shrivarsah_EV-Charging-Station-Management-System")
    SONARQUBE_ORGANIZATION: str = os.getenv("SONARQUBE_ORGANIZATION", "shrivarsah")
    SONARQUBE_TOKEN: str = os.getenv("SONARQUBE_TOKEN", "")
    
    # Jira Cloud Defaults
    JIRA_URL: str = os.getenv("JIRA_URL", "")
    JIRA_PROJECT_KEY: str = os.getenv("JIRA_PROJECT_KEY", "")
    JIRA_EMAIL: str = os.getenv("JIRA_EMAIL", "")
    JIRA_API_TOKEN: str = os.getenv("JIRA_API_TOKEN", "")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
