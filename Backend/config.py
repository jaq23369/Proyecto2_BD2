from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    neo4j_uri: str
    neo4j_username: str
    neo4j_password: str
    neo4j_database: str = "neo4j"
    aura_instanceid: str = ""
    aura_instancename: str = ""
    flask_debug: bool = False
    port: int = 5000
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    max_csv_size_mb: int = 50

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
