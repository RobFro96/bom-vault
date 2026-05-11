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
    _categories_dclass: dict[str, Category] = None

    def __post_init__(self):
        # sort categories by rank and name
        self.categories = dict(sorted(self.categories.items(),
                               key=lambda x: (x[1]["rank"], x[0].lower())))

        self._categories_dclass = dict()
        for category_name, category in self.categories.items():
            self._categories_dclass[category_name.lower()] = Category(**category)

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
