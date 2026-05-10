import glob
import logging
import yaml
import markdown
import json
import os

GLOB = "components/*.md"
ENCODING = "utf-8"
MD_EXTENSIONS = ["extra", "codehilite", "toc", "tables", "fenced_code"]
CATEGORIES_FILE = "categories.json"
DATASHEET_FOLDER = "website/datasheets"
OUTPUT_FILE = "website/output.js"
VAR_NAME = "EXPORTED"


class JsonExporter:
    def __init__(self, files: list) -> None:
        self.__load_categories()

        self.elements = list()
        for file in files:
            with open(file, "r", encoding=ENCODING) as f:
                content = f.read()
                analysis_result = self.analyze_markdown(file, content)

                if analysis_result is not None:
                    self.elements.append(analysis_result)

        self.elements.sort(key=lambda x: x["name"].lower())

    def save(self, output_file) -> None:
        with open(output_file, "w", encoding=ENCODING) as f:
            output = dict(categories=self.categories, elements=self.elements)
            json.dump(output, f, indent=4)

    def save_js(self, output_file, var_name) -> None:
        with open(output_file, "w", encoding=ENCODING) as f:
            output = dict(categories=self.categories, elements=self.elements)
            f.write(f"const {var_name} = {json.dumps(output, indent=4)};")

    def __load_categories(self) -> None:
        try:
            with open(CATEGORIES_FILE, "r", encoding=ENCODING) as f:
                self.categories = json.load(f)
        except FileNotFoundError:
            logging.exception("Categories file %s not found", CATEGORIES_FILE)
            self.categories = list()
        except json.JSONDecodeError:
            logging.exception("Categories file %s is not valid JSON", CATEGORIES_FILE)
            self.categories = list()

        # sort categories by rank and name
        self.categories.sort(key=lambda x: (x["rank"], x["name"].lower()))

    def analyze_markdown(self, filename: str, content: str) -> dict:
        splitted = content.split("---\n", 2)
        if len(splitted) < 2:
            logging.error("Cannot split markdown and YAML properties in file %s", filename)
            return None

        yaml_content = splitted[1]
        try:
            yaml_dict = yaml.safe_load(yaml_content)
        except yaml.YAMLError as e:
            logging.exception("Error parsing YAML properties in file %s", filename)
            return None

        if len(splitted) == 3:
            markdown_content = splitted[2]
            try:
                html_content = markdown.markdown(markdown_content, extensions=MD_EXTENSIONS)
                yaml_dict["notes"] = html_content
            except Exception:
                logging.exception("Error converting markdown to HTML in file %s", filename)
                return None

        name = os.path.splitext(os.path.basename(filename))[0]
        yaml_dict["name"] = name
        yaml_dict["categories"] = ", ".join(yaml_dict.get("category", []))
        yaml_dict["icon"] = self.__check_categories_output_icon(name, yaml_dict.get("category", []))
        yaml_dict["mouser"] = self.__extract_mouser_partnum(yaml_dict.get("link", ""))
        yaml_dict["search"] = self.__get_search_string(yaml_dict)

        yaml_dict["value_format"] = self.__format_values(yaml_dict.get("value", ""))
        yaml_dict["limit_format"] = self.__format_values(yaml_dict.get("limit", ""))
        yaml_dict["temp_format"] = self.__format_temperatures(yaml_dict)
        self.__check_datasheet(name)

        return yaml_dict

    def __format_values(self, val: str) -> None:
        if not val:
            return ""

        outputs = []
        for parts in val.split(","):
            parts = parts.strip()
            if "=" not in parts:
                outputs.append(parts)
                continue

            splitted = parts.split("=", 1)
            left_eq = splitted[0].strip()
            right_eq = splitted[1].strip() if len(splitted) > 1 else ""

            splitted = left_eq.split("_", 1)
            left_us = splitted[0].strip()
            right_us = splitted[1].strip() if len(splitted) > 1 else ""
            left_us = f"<i>{left_us}</i>" if (len(splitted) > 1 or len(left_us) == 1) else left_us
            right_us = f"<sub>{right_us}</sub>"

            outputs.append(f"{left_us}{right_us}={right_eq}")

        return ", ".join(outputs)

    def __get_search_string(self, element: dict) -> str:
        categories = "|".join(element.get("category", []))
        return f"{element["name"]}|{categories}|{element['manufacturer']}|{element['footprint']}|{element['value']}|{element['link']}".lower()

    def __check_categories_output_icon(self, name: str, item_categories: list) -> str:
        icon = "none"
        last_icon_rank = -1
        for item_category in item_categories:
            found = False
            for category in self.categories:
                if category["name"].lower() == item_category.lower():
                    found = True
                    if category["rank"] > last_icon_rank:
                        icon = category["name"]
                        last_icon_rank = category["rank"]

            if not found:
                logging.warning("Category %s not found, element: %s", item_category, name)

        return icon

    def __extract_mouser_partnum(self, link: str) -> str:
        if not "www.mouser." in link:
            return ""

        spitted = link.split("ProductDetail/")
        if len(spitted) < 2:
            return ""

        return spitted[1]

    def __format_temperatures(self, element: dict):
        tmin = element.get("Tmin", None)
        tmax = element.get("Tmax", None)

        if tmin is None or tmax is None:
            return ""

        return f"{tmin}...{tmax}°C"

    def __check_datasheet(self, name: str):
        if not os.path.exists(f"{DATASHEET_FOLDER}/{name}.pdf"):
            logging.warning("Datasheet %s not found", name)


if __name__ == "__main__":
    logging.basicConfig(format="%(asctime)s,%(msecs)03d %(levelname)-5s "
                        "[%(filename)s:%(lineno)d] %(message)s",
                        datefmt="%Y-%m-%d:%H:%M:%S",
                        level=logging.INFO)

    files = glob.glob(GLOB)
    exporter = JsonExporter(files)
    exporter.save_js(OUTPUT_FILE, VAR_NAME)
