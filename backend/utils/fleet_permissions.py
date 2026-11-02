"""Centralized Fleet Management authorization and company scoping."""
from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from models.user_model import find_user_by_id


def current_fleet_user():
    return find_user_by_id(get_jwt_identity())


def fleet_can_manage(user):
    return bool(user and user.get('role') in {'admin', 'supervisor'})


def fleet_can_read(user):
    return bool(user and user.get('role') in {'admin', 'supervisor', 'employee'})


def fleet_company_id(user):
    return user.get('company_id') if user else None


def fleet_manager_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not fleet_can_manage(current_fleet_user()):
            return jsonify({'error': 'Fleet manager access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


def fleet_read_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not fleet_can_read(current_fleet_user()):
            return jsonify({'error': 'Fleet access required'}), 403
        return fn(*args, **kwargs)
    return wrapper
