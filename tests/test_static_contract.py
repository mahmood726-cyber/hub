from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_hub_has_launchable_app_shell():
    html = read_text("index.html")

    for required in (
        'id="search-input"',
        'id="project-grid"',
        'id="filter-bar"',
        'id="results-summary"',
        'id="launchable-count"',
        'id="server-count"',
        'id="new-count"',
        'id="category-count"',
        'src="projects.js"',
        'src="app.js"',
    ):
        assert required in html

    assert "{{" not in html


def test_hub_project_registry_and_runtime_contract():
    projects = read_text("projects.js")
    app = read_text("app.js")

    assert "window.HTML_APPS_PROJECTS" in projects
    assert "Dose Response Pro" in projects
    assert "TruthCert Pairwise Pro" in projects
    assert "renderCard" in app
    assert "matchesSearch" in app
    assert "getLaunchBase" in app
    assert 'endsWith("/hub/index.html")' in app
    assert "file:// only" in app


def test_hub_submission_bundle_is_present():
    submission = ROOT / "e156-submission"

    for name in ("config.json", "paper.md", "protocol.md", "index.html"):
        assert (submission / name).is_file()
