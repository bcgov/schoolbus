import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import Promise from 'bluebird';


Promise.config({
  cancellation: true,
});


import App from './app.jsx';
import { ApiError } from './utils/http';


var initializationEl = document.querySelector('#initialization');
var progressBarEl = initializationEl.querySelector('.progress-bar');
var progress = +progressBarEl.getAttribute('aria-valuenow');
function incrementProgressBar(gotoPercent) {
  progress = Math.min(gotoPercent || (progress + 20), 100); // cap to 100%
  progressBarEl.style.width = `${progress}%`;
  progressBarEl.setAttribute('aria-valuenow', progress);
  progressBarEl.querySelector('span').textContent = `${progress}% Complete`;
}

function renderApp() {
  incrementProgressBar(100);
  initializationEl.classList.add('done');
  initializationEl.addEventListener('transitionend', function() { initializationEl.remove(); });

  const appElement = document.querySelector('#app');

  ReactDOM.render(App, appElement);

  $('#screen').css('padding-top', $('#header-main').height() + 10);
}

export default function startApp() {
  incrementProgressBar();

  Promise.all([]).then(() => {
    // Wrapping in a setTimeout to silence an error from Bluebird's promise lib about API requests
    // made inside of component{Will,Did}Mount.
    setTimeout(renderApp, 0);
  }).catch(err => {
    progressBarEl.classList.add('progress-bar-danger');
    progressBarEl.classList.remove('active');
    console.error(err);
    var errorMessage = String(err);
    if(err instanceof ApiError) {
      errorMessage = `Fetching ${err.jQxhr.url} failed — ${err.jQxhr.status}\n${err}`;
    }

    ReactDOM.render((
      <div id="loading-error-message">
        <h4>Error loading application</h4>
        <p>{errorMessage}</p>
      </div>
    ), document.getElementById('init-error'));
  });
}

window.onload = startApp;
