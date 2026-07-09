# Project Structure

Короткая карта основных файлов TeleVault.

- `app.py` - backend/server entry point
- `backend/parser.py` - Telegram export parser
- `backend/library.py` - library/storage state
- `frontend/index.html` - UI shell
- `frontend/app.js` - frontend logic/rendering
- `frontend/styles.css` - UI styles
- `run_windows.bat` - fallback/dev Windows launcher for diagnostics
- generated `TeleVault.exe` - normal user launcher in portable `dist/` builds
- `CHANGELOG.md` - release history
- `docs/dev/BUILD_ASSESSMENT.md` - historical build environment assessment
- `docs/dev/BUILD_NOTES.md` - historical build preparation notes
- `docs/dev/DEVELOPMENT_LOG.md` - development notes
- `docs/dev/EXE_PACKAGING_PLAN.md` - exe packaging plan
- `docs/release/RELEASE_CHECKLIST.md` - release checks

Этот файл нужен как простой ориентир по структуре проекта. Старые build assessment/notes остаются историческими снимками и не заменяют текущий release checklist.
