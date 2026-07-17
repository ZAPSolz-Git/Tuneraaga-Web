// src/utils/toastEvents.js
const toastEvents = {
  _listeners: [],

  show(message, type = "success") {
    const id = Date.now() + Math.random();
    this._listeners.forEach((fn) => fn({ id, message, type }));
    return id;
  },

  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== fn);
    };
  },
};

export { toastEvents };
