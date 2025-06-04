(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    // CommonJS (Node.js) and ES module (React) support
    module.exports = factory();
  } else {
    // Browser global support
    global.Toast = factory();
  }
}(typeof window !== 'undefined' ? window : this, function () {
  // Define the Toast library
  const Toast = (() => {
    const show = (msg, autoHide = true) => {
      GlobalToastMsg.innerHTML = msg;
      GlobalToast.classList.remove("hidden");
      if (autoHide) {
        setTimeout(() => {
          hide();
        }, 4000);
      }
    };
    const hide = () => {
      GlobalToast.classList.add("hidden");
    };

    return Object.freeze({
      show
    });
  })();

  return Toast;
}));