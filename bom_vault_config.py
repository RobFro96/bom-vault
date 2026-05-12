import dataclasses

import yaml


@dataclasses.dataclass
class Category:
    rank: int
    hide: bool = False


@dataclasses.dataclass
class BomVaultConfig:
    categories: dict[str, dict]
    md_extensions: list[str]
    footer: str
    footer_timestamp: str
    sftp_hostname: str = None
    sftp_port: int = 22
    sftp_user: str = None
    sftp_password: str = None
    sftp_path: str = None
    _categories_dclass: dict[str, Category] = None

    def __post_init__(self):
        # sort categories by rank and name
        self.categories = dict(sorted(self.categories.items(),
                               key=lambda x: (x[1]["rank"], x[0].lower())))

        self._categories_dclass = dict()
        for category_name, category in self.categories.items():
            self._categories_dclass[category_name] = Category(**category)

    @classmethod
    def from_yaml(cls, config_file) -> "BomVaultConfig":
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                return BomVaultConfig(**yaml.safe_load(f))
        except:
            return None


if __name__ == "__main__":
    config = BomVaultConfig.from_yaml("config.yaml")
    print(config)
