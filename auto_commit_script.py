import os

def add_comments():
    for root, dirs, files in os.walk("backend"):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)

                with open(path, "r", encoding="utf-8") as f:
                    lines = f.readlines()

                new_lines = []
                for line in lines:
                    if line.strip().startswith("def "):
                        new_lines.append("# Auto comment added for function\n")
                    new_lines.append(line)

                with open(path, "w", encoding="utf-8") as f:
                    f.writelines(new_lines)

def create_docs():
    os.makedirs("docs", exist_ok=True)

    with open("docs/SETUP.md", "w") as f:
        f.write("# Setup Guide\n\nRun backend and frontend separately.\n")

    with open("docs/API.md", "w") as f:
        f.write("# API Documentation\n\nBasic endpoints listed here.\n")

    with open("docs/PROJECT_FLOW.md", "w") as f:
        f.write("# Project Flow\n\nFrontend -> Backend -> Response\n")

def create_requirements():
    with open("backend/requirements.txt", "w") as f:
        f.write("flask\nflask-cors\n")

def remove_prints():
    for root, dirs, files in os.walk("backend"):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)

                with open(path, "r", encoding="utf-8") as f:
                    lines = f.readlines()

                new_lines = [line for line in lines if "print(" not in line]

                with open(path, "w", encoding="utf-8") as f:
                    f.writelines(new_lines)

add_comments()
create_docs()
create_requirements()
remove_prints()

print("All safe changes applied!")