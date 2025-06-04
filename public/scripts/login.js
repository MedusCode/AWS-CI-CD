/*************************************************************************
 * File: login.js
 * This file contains functions that support the log in page.
*************************************************************************/

/*************************************************************************
 * @function resetLoginForm
 * @desc 
 * After a user successfully logs in, this function should be called to
 * reset the form to its default state. 
 * @global GlobalErrorBox: The <div> containing the list of error messages
 * @global GlobalEmailField: The form's email field
 * @global GlobalPasswordField: The form's password field
 * @global GlobalEmailError: The error message for the email field
 *************************************************************************/
 function resetLoginForm() {
    document.title = "Log in to SpeedScore";
    GlobalErrorBox.classList.add("hidden");
    GlobalEmailError.classList.add("hidden");
    GlobalPasswordError.classList.add("hidden");
    GlobalEmailField.value = "";
    GlobalPasswordField.value = "";
}

/*************************************************************************
 * @function login
 * @desc 
 * When a user is successfully authenticated, this function resets the 
 * login form and configure the app's initial state and appearance. 
 * The login page is hidden and the default app mode ("Feed") is displayed. 
 * @param user: The user object for the authenticated user returned by the API
 * @global GlobalLoginPage: The login page <div>
 * @global GlobalModeTabsContainer: The <div> containing the mode tabs
 * @global GlobalModeTabPanels: Array of tab panels associated with each mode
 * @global GlobalCurrentMode: Integer index indicating current mode 
 * @global GlobalSearchBtn: The search button in the top banner bar
 * @global GlobalProfileBtn: The profile picture button in the top banner bar
 *************************************************************************/
 async function login(user) {
    //1. Reset the login form in case user logs in again
    resetLoginForm();
    //2. Place user acct data of logged in user in global JS object
    GlobalUserData = user;
    const responseObj = await api.processPendingRequests();
    const results = responseObj.results;
    let toastMsg = "";
    for (let i = 0; i < results.length; i++) {
        if (results[i].success && results[i].message.includes("Pending round")) { //Add round
            GlobalUserData.rounds.push(results[i].data); //Add round to user's rounds
        } else if (results[i].success && results[i].message.includes("Pending updates")) { //Update round
            let roundIndex = GlobalUserData.rounds.findIndex(r => r._id === results[i].data._id);
            GlobalUserData.rounds[roundIndex] = results[i].data; //Update round in user's rounds
        }
        toastMsg += results[i].message;
        if (i < results.length - 1) {
            toastMsg += "<br>";
        }
    }
    //3. Populate the "Rounds" table
    populateRoundsTable();
    //4. Reset state of app with user logged in.
    GlobalLoginPage.classList.add("hidden");
    GlobalModeTabsContainer.classList.remove("hidden");
    GlobalModeTabPanels[GlobalCurrentMode.get()].classList.remove("hidden");
    GlobalMenuBtn.classList.remove("hidden");
    GlobalMenu.classList.remove("hidden");
    GlobalSearchBtn.classList.remove("hidden");
    GlobalProfileBtn.classList.remove("hidden");
    GlobalProfileBtn.style.backgroundImage = "url(" + GlobalUserData.identityInfo.profilePic + ")";
    GlobalModeTabButtons[0].click(); //Switch to "Feed" mode
    if (toastMsg.length > 0) {
        Toast.show(toastMsg, false);
    }
}

/*************************************************************************
 * @function Login Form SUBMIT Handler 
 * @Desc 
 * When the user clicks on the "Log In" button, we first check the
 * validity of the email and password fields, presenting accessible
 * error notifications if errors exist. If no errors exist, we
 * call the login() function, passing in the username of the user
 * @global GlobalLoginForm: the <form> element whose 
 *         SUBMIT handler is triggered
 * @global GlobalEmailField: The form's email field
 * @global GlobalPasswordField: The form's password field
 * @global GlobalErrorBox: The <div> containing the error messages
 * @global GlobalEmailError: The error message for the email field
 * @global GlobalPasswordError: The error message for the password field
 *************************************************************************/
 loginForm.addEventListener("submit", async function(e) {
    e.preventDefault(); //Prevent default submti behavior
    //Is the email field valid?
    let emailValid = !GlobalEmailField.validity.typeMismatch && 
                     !GlobalEmailField.validity.valueMissing;
    //Is the password field valid?
    let passwordValid = !GlobalPasswordField.validity.patternMismatch && 
                        !GlobalPasswordField.validity.valueMissing;
    //Attempt to login the user via the API

    //Did the user specify valid account credentials?
    if (emailValid && passwordValid) { //attempt login
        Spinner.show();
        const response = await api.login({email: GlobalEmailField.value, password: GlobalPasswordField.value});
        Spinner.hide();
        if (response.success) { //Login successful!
            login(response.data);
        } else { //Authentication failed
            Toast.show("Log in failed: " + response.message, true);
        }
        return;
    }
    //If here, at least one field is invalid in the form: Display the errors
    GlobalErrorBox.classList.remove("hidden");
    document.title = "Error: Log in to SpeedScore";
    if (!passwordValid) { //Password field is invalid
         GlobalPasswordError.classList.remove("hidden");
         GlobalPasswordError.focus();
     } else {
         GlobalPasswordError.classList.add("hidden");
     } 
    if (!emailValid) { //Email field is invalid
        GlobalEmailError.classList.remove("hidden");
        GlobalEmailError.focus();
    } else {
        GlobalEmailError.classList.add("hidden");
    }
    if (emailValid && passwordValid) { //Authentication failed
       GlobalAuthError.classList.remove("hidden");
       GlobalAuthError.focus();
     } else {
         GlobalAuthError.classList.add("hidden");
     }
 });

 GlobalGithubSignInBtn.addEventListener("click", function(e) {
    window.location.href = GlobalApiUrl + '/auth/github'
});