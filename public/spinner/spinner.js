(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    // CommonJS (Node.js) and ES module (React) support
    module.exports = factory();
  } else {
    // Browser global support
    global.Spinner = factory();
  }
}(typeof window !== 'undefined' ? window : this, function () {
  // Define the spinner library
  const Spinner = (() => {
    let spinnerElement;

    const createSpinner = () => {
      spinnerElement = document.createElement('div');
      spinnerElement.id = 'spinner';
      spinnerElement.style.display = 'none';
      spinnerElement.style.position = 'fixed';
      spinnerElement.style.top = '50%';
      spinnerElement.style.left = '50%';
      spinnerElement.style.transform = 'translate(-50%, -50%)';
      spinnerElement.style.zIndex = '1000';
      spinnerElement.innerHTML = `
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      `;
      document.body.appendChild(spinnerElement);
    };

    const showSpinner = () => {
      if (!spinnerElement) {
        createSpinner();
      }
      spinnerElement.style.display = 'block';
    };

    const hideSpinner = () => {
      if (spinnerElement) {
        spinnerElement.style.display = 'none';
      }
    };

    return Object.freeze({
      show: showSpinner,
      hide: hideSpinner
    });
  })();

  return Spinner;
}));