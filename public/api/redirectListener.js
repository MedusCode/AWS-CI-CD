/*************************************************************************
 * @file redirectListener.js
 * @desc
 * This file defines a page load handler that handles redirects from 
 * SpeedScore's API. There are three redirects to handle:
 * 1. When the path is /emailverified', the user has successfully 
 *    verified their email and can log in.
 * 2. When the path is /emailvalidationerror, an error occurred when
 *    the user attempted to verify their email. We need to look at
 *    the 'reason' query param to provide more info.
 * 3. When the OAuth flow completes, we receive the user's ID as a
 *    query parameter and use it obtain the user's data from the
 *    API. If the user's data is successfully retrieved, we log
 *    the user in. Our request to the API's /users/:id endpoint 
 *    only works because the redirect happens after the user has been
 *    authenticated with the API and access and refresh tokens have 
 *    been attached to the user's session as http-only cookies.
 *  NOTE: We indicate that redirect processing is complete by calling
 *  window.resolveRedirect() if it exists. This tells the window.load
 *  event listener in window.js that it can proceed with its normal
 *  initialization logic.
 *************************************************************************/
window.addEventListener('load', async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const path = window.location.pathname;

  if (urlParams.has('emailverified') && urlParams.get('emailverified') === 'true') {
    Toast.show('Your email has been verified. You can now log in.',false);
  } else if (urlParams.has('emailVerified') && urlParams.get('emailVerified') === 'false') {
    const reason = urlParams.get('reason');
    if (reason === 'invalidtoken') {
      Toast.show('Your email verification link has expired. Please request a new one.',false);
    } else {
      Toast.show('There was an error verifying your email. Please request a new verification link.',false);
    }
  } else if (urlParams.has('id')) {
    const id = urlParams.get('id');
    response = await api.getUser(id);
    if (response.success) {
      //this.history.pushState({previousMode: 0, previousPage: "LOGIN_PAGE", currentMode: 0, currentPage: "LOGIN_PAGE"}, '', '/'); //Remove the id from the URL
      login(response.data);
    } else {
      Toast.show('Error logging in via OAuth: ' + response.message, false);
    }   
  } 
  //Indicate that redirect processing is complete.
  if (window.resolveRedirect) {
    window.resolveRedirect();
}
});