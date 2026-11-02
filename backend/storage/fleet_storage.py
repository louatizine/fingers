"""Local fleet file storage with an adapter-shaped API."""
from pathlib import Path
import mimetypes
import secrets

from werkzeug.utils import secure_filename


class FleetStorageError(ValueError):
    """Raised when a fleet upload is invalid."""


class FleetStorage:
    MAX_BYTES = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.webp'}
    ALLOWED_MIME_TYPES = {
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
    }

    def __init__(self, root=None):
        self.root = Path(root or Path(__file__).resolve().parents[1] / 'uploads' / 'fleet')

    def _category_path(self, category):
        if category not in {'vehicles', 'licenses', 'documents', 'invoices', 'maintenance', 'worked_hours'}:
            raise FleetStorageError('Invalid fleet upload category')
        path = (self.root / category).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path

    def save(self, file, category):
        if not file or not file.filename:
            raise FleetStorageError('A file is required')
        filename = secure_filename(file.filename)
        extension = Path(filename).suffix.lower()
        content_type = (file.mimetype or mimetypes.guess_type(filename)[0] or '').lower()
        if extension not in self.ALLOWED_EXTENSIONS or content_type not in self.ALLOWED_MIME_TYPES:
            raise FleetStorageError('Unsupported file type')
        file.stream.seek(0, 2)
        size = file.stream.tell()
        file.stream.seek(0)
        if size > self.MAX_BYTES:
            raise FleetStorageError('File exceeds the 10 MB limit')
        stored_name = f'{secrets.token_urlsafe(24)}{extension}'
        path = self._category_path(category) / stored_name
        file.save(path)
        return {
            'storedName': stored_name,
            'originalName': filename,
            'contentType': content_type,
            'size': size,
            'category': category,
        }

    def delete(self, stored_name, category):
        path = self._category_path(category) / Path(stored_name).name
        if path.is_file():
            path.unlink()

    def get_path(self, stored_name, category):
        path = (self._category_path(category) / Path(stored_name).name).resolve()
        if path.parent != self._category_path(category):
            raise FleetStorageError('Invalid file path')
        return path
