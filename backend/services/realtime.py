"""Simple in-process SSE fan-out for live notifications."""
from collections import defaultdict
from queue import Queue, Empty
from threading import Lock

_subscribers = defaultdict(list)
_lock = Lock()


def subscribe(user_id):
    queue = Queue(maxsize=50)
    with _lock:
        _subscribers[str(user_id)].append(queue)
    return queue


def unsubscribe(user_id, queue):
    with _lock:
        listeners = _subscribers.get(str(user_id), [])
        if queue in listeners:
            listeners.remove(queue)
        if not listeners and str(user_id) in _subscribers:
            del _subscribers[str(user_id)]


def publish(user_id, event):
    with _lock:
        listeners = list(_subscribers.get(str(user_id), []))
    for queue in listeners:
        try:
            queue.put_nowait(event)
        except Exception:
            pass


def publish_many(user_ids, event):
    for user_id in {str(value) for value in user_ids if value}:
        publish(user_id, event)


def wait_event(queue, timeout=25):
    try:
        return queue.get(timeout=timeout)
    except Empty:
        return None
