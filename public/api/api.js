/*************************************************************************
 * @file api.js
 * @desc
 * This file contains functions for making API requests to process
 * user workflows and update the database. It uses the immediately-
 * invoked function expression (IIFE) pattern to define the module.
 * This makes the module accessible in both a browser and Node.js
 * environment. The module is exported to the global scope if the
 * script is loaded in a browser, and is exported as a module if
 * the script is loaded in Node.js.
 *************************************************************************/

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.api = factory();
    }
  }(typeof self !== 'undefined' ? self : this, function () {

    const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const getRoundId = (endpoint) => endpoint.split('/').pop();
    const isTempRoundId = (id) => uuidv4Regex.test(id);

    /*************************************************************************
     * @function isValidUrl
     * @desc
     * This function checks if a given string is a valid URL.
     * @param urlString: The string to check
     * @returns: True if the string is a valid URL, false otherwise
     * *************************************************************************/
    const isValidUrl = (urlString) => {
        try {
            new URL(urlString);
            return true;
        } catch (e) {
            return false;
        }
    }
  
    /*************************************************************************
     * @function computeSGS
     * @desc
     * This function computes the Speed Golf Score (SGS) for a round.
     * @param strokes: The number of strokes taken in the round
     * @param seconds: The time taken to complete the round in seconds
     * @returns: A string representing the SGS in the format "min:sec"
     * *************************************************************************/
    const computeSGS = (strokes, seconds) => {
      const totalSeconds = (strokes * 60) + seconds;
      const min = Math.floor(totalSeconds / 60);
      const sec = totalSeconds % 60;
      return (min + ":" + sec.toString().padStart(2,'0'));
    }
  
    /*************************************************************************
     * @function computeTime
     * @desc
     * This function converts seconds to "min:sec" format.
     * @param seconds: The time in seconds
     * @returns: A string representing the time in the format "min:sec"
     * *************************************************************************/
    const computeTime = (seconds) => {
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      return (min + ":" + sec.toString().padStart(2,'0'));
    }

    const computeMinutes = (seconds) => Math.floor(seconds / 60);
    const computeSeconds = (seconds) => seconds % 60;
  
    /*************************************************************************
    * @function addPendingRequest
    * @desc
    * This function adds a pending request, including a future success message,
    * to local storage.
    * @param action: The action to add to the cache
    * @param endpoint: The API endpoint for the request
    * @param method: The HTTP method for the request
    * @param data: The data to send in the request body
    * @returns: To match the return signature of processPendingRequests, this
    * function returns an object with two properties: results and tempIdToId.
    * The results property is an array containing a single object with success,
    * message, and data properties. The tempIdToId property is an empty object.
    * Essentially, this function always returns success, as it only adds a 
    * request to the pending requests queue in localStorage. Since it does not
    * actually send the request to the server, it does not need to process any
    * pending requests or update the tempIdToId map.
    * *************************************************************************/
    const addPendingRequest = (action, endpoint, method, data) => {
      const userId = GlobalUserData._id;
      const pendingRequests = JSON.parse(localStorage.getItem(userId)) || [];
      let futureSuccessMsg, futureFailMsg, message;
      switch (action) {
          case 'Add round':
              futureSuccessMsg = `Pending round played on ${data.date} at ${data.course} saved to database.`;
              futureFailMsg = `Error: Pending round played on ${data.date} at ${data.course} could not be saved to database.`;
              message = `You are offline. Your round has been saved locally. SpeedScore will try to save your round to the database when you are back online.`;
              data.SGS = computeSGS(data.strokes, data.seconds);
              data.min = computeMinutes(data.seconds);
              data.sec = computeSeconds(data.seconds)
              data.time = computeTime(data.seconds);
              data._id = uuid.v4(); // Generate a temporary unique ID for this round.
              break;
          case 'Update round':
              futureSuccessMsg = `Pending updates to round played on ${data.date} at ${data.course} saved to database.`;
              futureFailMsg = `Error: Pending updates to round played on ${data.date} at ${data.course} could not be saved to database.`;
              message = `You are offline. Pending updates to your round have been saved locally. SpeedScore will try to save your updated round to the database when you are back online.`;
              data.SGS = computeSGS(data.strokes, data.seconds);
              data.min = computeMinutes(data.seconds);
              data.sec = computeSeconds(data.seconds)
              data.time = computeTime(data.seconds);      
              break;
          default:
              futureSuccessMsg = `Data saved to database.`;
              futureFailMsg = `Error: Data could not be saved to database.`;
              message = `You are offline. Your request has been saved locally. SpeedScore will try to save your request to the database when you are back online.`;
              break;
      }
      const newItem = {successMsg: futureSuccessMsg,
                       failMsg: futureFailMsg,
                       endpoint: endpoint, 
                       method: method,
                       data: data};
          pendingRequests.push(newItem);
          localStorage.setItem(userId, JSON.stringify(pendingRequests));
          return {results: [{success: true, message: message, data: data}], tempIdToId: {}}; //Return success;
      }
  
      /*************************************************************************
       * @function processPendingRequests
       * @desc
       * This function processes any pending state-changing API requests that 
       * were cached while the user was offline, but that are reflected in the
       * data displayed in the app. It retrieves the pending requests from 
       * local storage, gets the anti-csrf token for the user, and sends the
       * requests to the server. Each successful request is removed from the
       * pending requests list. 
       * @returns: An object containing two fields: results and tempIdToId. The
       * results field is an array of objects with success, message, and possibly
       * data properties (if the request was successful). The first object in the
       * array is the result of the current request, and any subsequent objects
       * are the results of processing any pending requests. The tempIdToId field
       * is a map of temporary round IDs (created when a round is added offline)
       * to MongoDB ObjectIDs (created when the round is saved to the database). 
       * *************************************************************************/
        const processPendingRequests = async () => {   
            //0. Get pending requests from local storage
            const pendingRequests = JSON.parse(localStorage.getItem(GlobalUserData._id));
            if (!pendingRequests || pendingRequests.length === 0) {
                return {results: [], tempIdToId: {}}; //No pending requests
            } 
            //1. Get anti-csrf token for the user
            const userId = GlobalUserData._id;
            const antiCsrfToken = await getAntiCsrfToken(userId);
            if (!antiCsrfToken) {
                return {results: [{ success: false, message: 'Could not save pending data to database: ' +
                                    'Error getting anti-csrf token' }], tempIdToId: {}};
            }
            //2. Process each pending action
            const tempIdToId = {}; //Map of temporary round IDs to MongoDB round IDs
            let roundId;
            const results = [];
            const pendingRequestsCopy = [...pendingRequests];
            for (const request of pendingRequestsCopy) {
                //Capture the temporary ID of the round being added
                if (request.method === 'POST') {
                roundId = request.data._id;
                delete request.data._id; //Remove the temporary ID, as it will be rejected by the API
                } else if (request.method === 'PUT') {
                //See if the ID of the round being updated is a temporary ID
                roundId = getRoundId(request.endpoint);
                if (isTempRoundId(roundId)) {
                    //Need to replace the temporary ID with the actual ID in the endpoint
                    request.endpoint = request.endpoint.replace(roundId, tempIdToId[roundId]);
                }
                delete request.data._id; //Remove the temporary ID, as it will be rejected by the API
                }
                const response = await apiRequest(request.endpoint, request.method, request.data, antiCsrfToken);
                results.push({success: response.success, 
                            message: response.success ? request.successMsg : request.failMsg,
                            data: response.data || null
                            });
                if (response.success) { //Remove the request from the pending list
                    if (request.method === 'POST') {
                        //Capture the actual ID of the round that was added
                        tempIdToId[roundId] = response.data._id;
                    }
                    const index = pendingRequests.indexOf(request);
                    pendingRequests.splice(index, 1);
                }
            }
            localStorage.setItem(userId, JSON.stringify(pendingRequests));
            return {results, tempIdToId};
        }
  
    /*************************************************************************
     * @function apiRequest
     * @desc
     * This function makes an API request to the server. It takes an endpoint,
     * method, data, and anti-csrf token as arguments.
     * @param endpoint: The API endpoint to send the request to
     * @param method: The HTTP method to use for the request
     * @param data: The data to send in the request body
     * @param antiCsrfToken: The anti-csrf token to include in the request header
     * @returns: A JSON object containing the response status, data, and message
     * *************************************************************************/
      const apiRequest = async (endpoint, method, data = null, antiCsrfToken = null) => {
  
          const fullUrl = `${GlobalApiUrl}/${endpoint}`;
  
          if (!isValidUrl(fullUrl)) {
              console.error('Invalid URL:', fullUrl);
              return { success: false, message: 'Invalid URL' };
          }
          try {
              const requestOptions = {
                  method,
                  headers: {
                  'Content-Type': 'application/json',
                  ...(antiCsrfToken && { 'x-anti-csrf-token': antiCsrfToken })
                  },
                  body: data ? JSON.stringify(data) : null,
                  credentials: 'include' // Ensure credentials are included
              };
              const response = await fetch(fullUrl, requestOptions);
              console.log("Api result:", response);
  
              if (!response.ok) {
                  const errorResponse = await response.json();
                  return { 
                      success: false, 
                      message: errorResponse.message || 'An error occurred', 
                      ...errorResponse 
                  };
              }
              const responseData = await response.json();
              return {success: true, data: responseData};
          } catch (error) {
              if (error.name === 'TypeError') {
                  console.error('Network error or invalid URL:', error);
                  return { success: false,  message: 'Network error or invalid URL' };
              } else if (error.name === 'SyntaxError') {
                  console.error('Response parsing error:', error);
                  return { success: false, message: 'Response parsing error' };
              } else {
                  console.error('Unexpected error:', error);
                  return { success: false, message: 'Unexpected error' };
              }
          }
      };
  
      /*************************************************************************
       * @function getAntiCsrfToken
       * @desc
       * This function makes a GET request to the server to obtain an anti-csrf
       * token for a given user ID.
       * @param userId: The ID of the user to obtain the anti-csrf token for
       * @returns: The anti-csrf token for the user
       * *************************************************************************/
      const getAntiCsrfToken = async(userId) => {
          const response = await apiRequest(`auth/anti-csrf-token/${userId}`, 'GET');
          if (!response.success) {
              console.error('Error getting anti-csrf token:', response);
              return null;
          }
          return response.data.antiCsrfToken;
      };
  
      /*********************************************************************
       * @function registerAccount
       * @desc
       * This function makes a POST request to the server to register a new
       * account.
       * @param accountData: The data for the new account
       * @returns: A JSON object containing the response status, data, and message
       * *********************************************************************/
      const registerAccount = async (accountData) => {
          return await apiRequest('auth/register', 'POST', accountData);
      };
  
      /*********************************************************************
       * @function login
       * @desc
       * This function makes a POST request to the server to log in a user.
       * @param accountData: The data for the account to log in
       * @returns: A JSON object containing the response status, data, and message
       * *********************************************************************/
      const login = async (accountData) => {
          return await apiRequest('auth/login', 'POST', accountData);
      }
  
      /*********************************************************************
       * @function logout
       * @desc
       * This function makes a DELETE request to the server to log out a user.
       * @returns: A JSON object containing the response status, data, and message
       * *********************************************************************/
      const logout = async () => {
        const userId = GlobalUserData._id;
        return await apiRequest(`auth/logout/${userId}`, 'DELETE');
      }
  
    /*************************************************************************
     * @function updateUser
     * @desc
     * This function makes a PUT request to the server to update a user's data.
     * @param userData: The data to update for the user. Only the props to
     *        update should be included in the object. All other props are
     *        left unchanged.
     * @returns: An array of objects with success, message, and possibly
     *           data properties (if the request was successful). The first
     *           object in the array is the result of the current request, and
     *           any subsequent objects are the results of processing any
     *           pending requests.
     * *************************************************************************/
    const updateUser = async (userData) => {
      const userId = GlobalUserData._id;
      const antiCsrfToken = await getAntiCsrfToken(userId);
      if (!antiCsrfToken) {
          return { success: false, message: 'Error getting anti-csrf token' };
      }
      const result = await apiRequest(`users/${userId}`, 'PUT', userData, antiCsrfToken);
      if (result.success) {
          result.message = 'User data updated successfully.';
      } else {
          result.message = 'Error updating user data: ' + result.message;
      }
      return result;
    } 
  
    /*************************************************************************
     * @function addRound
     * * @desc
     * This function makes a POSt request to the server to add a round
     * to the user's data. If the user is offline, the request is added to
     * pendingRequests. Any pending requests are processed before the
     * current request is sent.
     * @param roundData: The data for the round to update
     * @returns: An object with results and tempIdToId properties. The results
     *          property is an array of objects with success, message, and
     *         possibly data properties (if the request was successful). The
     *        first object in the array is the result of the current request,
     *      and any subsequent objects are the results of processing any
     *    pending requests. The tempIdToId property is a map of temporary
     * round IDs to actual round IDs.
     * *************************************************************************/
    const addRound = async (roundData) => {
      const userId = GlobalUserData._id;   
      if (!navigator.onLine) { //Offline -- add request to pendingRequests
          return addPendingRequest("Add round", `users/${userId}/rounds`, 'POST', roundData);
      }
      const antiCsrfToken = await getAntiCsrfToken(userId);
      if (!antiCsrfToken) {
          return {results: [{ success: false, message: 'Error getting anti-csrf token' }], tempIdToId: {}};
      }
      const resultsObj = await processPendingRequests();
      const requestResult = await apiRequest(`users/${userId}/rounds`, 'POST', roundData, antiCsrfToken);
      if (requestResult.success) {
          requestResult.message = 'New round logged.';
      } else {
          requestResult.message = 'Error logging round: ' + requestResult.message;
      }
      resultsObj.results.unshift(requestResult); //Add current result to front of results
      return resultsObj;
    }
  
    /*************************************************************************
     * @function updateRound
     * @desc
     * This function makes a PUT request to the server to update a round
     * in a user's data. If the user is offline, the request is added to
     * pendingRequests. Any pending requests are processed before the
     * current request is sent.
     * @param roundData: The data for the round to update
     * @returns: An object with results and tempIdToId properties. The results
     *          property is an array of objects with success, message, and
     *         possibly data properties (if the request was successful). The
     *        first object in the array is the result of the current request,
     *      and any subsequent objects are the results of processing any
     *    pending requests. The tempIdToId property is a map of temporary
     * round IDs to actual round IDs.
     * *************************************************************************/
    const updateRound = async (roundData) => {
      const userId = GlobalUserData._id;
      const roundId = roundData._id;
      if (!navigator.onLine) { //Offline -- add request to pendingRequests
          return addPendingRequest("Update round", `users/${userId}/rounds/${roundId}`,
                                   "PUT", roundData);
      }
      const antiCsrfToken = await getAntiCsrfToken(userId);
      if (!antiCsrfToken) {
        return {results: [{ success: false, message: 'Error getting anti-csrf token' }], tempIdToId: {}};
      }
      const resultsObj = await processPendingRequests();
      if (resultsObj.tempIdToId.hasOwnProperty(roundId)) {
            roundId = resultsObj.tempIdToId[roundId]; //Replace temporary ID with actual
      }   
      const requestResult =  await apiRequest(`users/${userId}/rounds/${roundId}`, 'PUT', roundData, antiCsrfToken);
      if (requestResult.success) {
          requestResult.message = 'Round updated.';
      } else {
          requestResult.message = 'Error updating round: ' + requestResult.message;
      }
      resultsObj.results.unshift(requestResult); //Add current result to front of results
      return resultsObj;
  }
  
     /*************************************************************************
      * @function getUser
      * @desc
      * This function makes a GET request to the server to obtain a user's data.
      * @param id: The ID of the user to obtain the data for
      * @returns: A JSON object containing the response status, data, and message
      * *************************************************************************/
    const getUser = async (id) => {
      const antiCsrfToken = await getAntiCsrfToken(id);
      if (!antiCsrfToken) {
          return { success: false, message: 'Error getting anti-csrf token' };
      }
      const response =  await apiRequest(`users/${id}`, 'GET', null, antiCsrfToken);
      return response;
    }
  
    return {
        processPendingRequests,
        registerAccount,
        login,
        logout,
        updateUser,
        addRound,
        updateRound,
        getUser
    };
  }));