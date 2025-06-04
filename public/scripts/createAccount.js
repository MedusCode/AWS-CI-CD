 /*************************************************************************
 * File: createAccount.js
 * This file contains functions that support the "Create Account" Dialog.
 ************************************************************************/

/*************************************************************************
 * @function createAccountBtn CLICK Handler 
 * @Desc 
 * When the user clicks the "Create Account" button link on the "Log In"
 * page, transition to the "Create Account" dialog.
 * @global GlobalCreateAccountDialog: The "Create Account" dialog
 * @global GlobalLoginPage: The Log In page
 * @global GlobalAcctEmailField: The email field
 *************************************************************************/
GlobalCreateAccountBtn.addEventListener("click",function(e) {
    GlobalLoginPage.classList.add("hidden");
    GlobalCreateAccountDialog.classList.remove("hidden");
    document.title = "Create Account";
    GlobalAcctEmailField.focus();
});

/*************************************************************************
 * @function resetCreateAccountForm 
 * @Desc 
 * When the user exits the "Create Account" Dialog, reset the form to
 * show blank data in case the form is visited again.
 * @global GlobalAcctEmailField: Form's email field
 * @global GlobalAcctPasswordField: Form's password field
 * @global GlobalAcctPasswordRepeatField: Form's repeat pw field
 * @global GlobalAcctDisplayNameField: Form's display name field
 * @global GlobalAcctSecurityQuestionField: Form's security q field
 * @global GlobalAcctSecurityAnswerField: Form's security answ field
 * @global GlobalAcctErrBox: <div> containing the error messages
 * @global GlobalAcctEmailErr: Error message for email field
 * @global GlobalAcctPasswordErr: Error message for password field
 * @global GlobalAcctRepeatPasswordErr: Error message for repeat pw field
 * @global GlobalAcctDisplaynameErr: Error message for display name field
 * @global GlobalAcctSecurityQuestionErr: Error message for security q field
 * @global GlobalAcctSecurityAnswerErr: Error message for security answ field
 *************************************************************************/
 function resetCreateAccountForm() {
    GlobalAcctEmailField.value = "";
    GlobalAcctPasswordField.value = "";
    GlobalAcctPasswordRepeatField.value = "";
    GlobalAcctErrBox.classList.add("hidden");
    GlobalAcctEmailErr.classList.add("hidden");
    GlobalAcctPasswordErr.classList.add("hidden");
    GlobalAcctPasswordRepeatErr.classList.add("hidden");
    GlobalFirstFocusableCreateAccountItem.set(GlobalAcctEmailField);
}


 /*************************************************************************
 * @function createAccount 
 * @desc 
 * Given a JavaScript object containing a new account, create the account,
 * return the user to the "Log In" page, and display a toast message
 * indicating that a new account was created.
 * @global loginPage: The "Log In" page
 * @global createAccountDialog: The "Create Account" dialog
 * @global accountCreatedEmail: The field in the toast notification where
 *         we display the email of the new account.
 * @global: accountCreated: The toast notification on the "Log In" page
  *************************************************************************/
async function createAccount() {
    const newAcct = {
        email: GlobalAcctEmailField.value,
        password: GlobalAcctPasswordField.value,
    };
    const response = await api.registerAccount(newAcct);
    let toastMsg;
    if (response.success) { //Account registered successfully
        toastMsg = "Account created. Please check your email for a verification link.";
    } else { //Error registering account
        toastMsg = "Error creating account: " + response.message
    }
    Toast.show(toastMsg,false);
    //Reset form in case it is visited again
    resetCreateAccountForm();
    //Transition to "Log In" page
    document.title = "Log In to SpeedScore";
    GlobalCreateAccountDialog.classList.add("hidden");
    GlobalLoginPage.classList.remove("hidden");
}

/*************************************************************************
 * @function createAccountForm SUBMIT Handler 
 * @Desc 
 * When the user clicks on the "Create Account" button, we first check the
 * validity of the fields, presenting accessible
 * error notifications if errors exist. If no errors exist, we
 * call the createAccount() function, passing in the account data
 * @global GlobalCreateAccountForm: the <form> element whose 
 *         SUBMIT handler is triggered
 * @global GlobalAcctEmailField: Form's email field
 * @global GlobalAcctPasswordField: Form's password field
 * @global GlobalAcctPasswordRepeatField: Form's repeat pw field
 * @global GlobalAcctDisplayNameField: Form's display name field
 * @global GlobalAcctSecurityQuestionField: Form's security q field
 * @global GlobalAcctSecurityAnswerField: Form's security answ field
 * @global GlobalAcctErrBox: <div> containing the error messages
 * @global GlobalAcctEmailErr: Error message for email field
 * @global GlobalAcctPasswordErr: Error message for password field
 * @global GlobalAcctRepeatPasswordErr: Error message for repeat pw field
 * @global GlobalAcctDisplaynameErr: Error message for display name field
 * @global GlobalAcctSecurityQuestionErr: Error message for security q field
 * @global GlobalAcctSecurityAnswerErr: Error message for security answ field
 *************************************************************************/
  createAccountForm.addEventListener("submit",function(e) {
    e.preventDefault(); //Prevent default submit behavior
    //Is the email field valid?
    let emailValid = !GlobalAcctEmailField.validity.typeMismatch && 
                     !GlobalAcctEmailField.validity.valueMissing;
    //Is the password field valid?
    let passwordValid = !GlobalAcctPasswordField.validity.patternMismatch && 
                        !GlobalAcctPasswordField.validity.valueMissing;
    let repeatPasswordValid = (GlobalAcctPasswordField.value === 
                               GlobalAcctPasswordRepeatField.value);
    
    if (emailValid && passwordValid && repeatPasswordValid) { 
       createAccount();
       return;
    }
    //If here, at least one field is invalid: Display the errors
    //and allow user to fix them.
    GlobalAcctErrBox.classList.remove("hidden");
    document.title = "Error: Create Account";
    if (!repeatPasswordValid) { //Password repeat field is invalid
        GlobalAcctPasswordRepeatErr.classList.remove("hidden");
        GlobalAcctPasswordRepeatErr.focus();
        GlobalFirstFocusableCreateAccountItem.set(GlobalAcctPasswordRepeatErr);
    } else {
        GlobalAcctPasswordRepeatErr.classList.add("hidden");
    } 
    if (!passwordValid) { //Password field is invalid
        GlobalAcctPasswordErr.classList.remove("hidden");
        GlobalAcctPasswordErr.focus();
        GlobalFirstFocusableCreateAccountItem.set(GlobalAcctPasswordErr);
    } else {
        GlobalAcctPasswordErr.classList.add("hidden");
    } 
    if (!emailValid) { //Email field is invalid
        GlobalAcctEmailErr.classList.remove("hidden");
        GlobalAcctEmailErr.focus();
        GlobalFirstFocusableCreateAccountItem.set(GlobalAcctEmailErr);
    } else {
        GlobalAcctEmailErr.classList.add("hidden");
    }
 });

  /*************************************************************************
 * @function cancelCreateAccountBtn CLICK Handler 
 * @Desc 
 * When the user clicks the "Cancel" button to exit "Create Account" Dialog, 
 * reset the form and transition to the Log In page.
 * @global createAccountDialog: The "Create Account" dialog
 * @global loginPage: The Log In page
 *************************************************************************/
   cancelCreateAccountBtn.addEventListener("click",function(e) {
    resetCreateAccountForm();
    document.title = "Log In to SpeedScore";
    GlobalCreateAccountDialog.classList.add("hidden");
    GlobalLoginPage.classList.remove("hidden");
});

/*************************************************************************
 * @function keyDownCreateDialogFocused 
 * @desc 
 * When the user presses a key with an element in the Create Account 
 * dialog focused, we implement the accessible keyboard interface for
 * a modal dialog box. This means that "Escape" dismisses the dialog and
 * that it is impossible to tab outside of the dialog box.
 * @global createAccountDialog: The "Create Account" dialog
 * @global loginPage: The Log In page
 * @global firstFocusableCreateAccountItem: References the first focusable
 *         item in "Create Account" dialog. 
 * @global cancelCreateAccountBtn: The "Cancel" button (last focusable 
 *         item in "Create Account" dialog)
 *************************************************************************/
function keyDownCreateDialogFocused(e) {
    if (e.code === "Escape") {
        GlobalCancelCreateAccountBtn.click();
        return;
    }
    if (e.code === "Tab" && document.activeElement == GlobalFirstFocusableCreateAccountItem.get() &&
       e.shiftKey) {
        //shift focus to last focusable item in dialog
        GlobalCancelCreateAccountBtn.focus();
        e.preventDefault();
        return;
    }
    if (e.code === "Tab" && document.activeElement == GlobalCancelCreateAccountBtn &&
        !e.shiftKey) {
        //shift focus to first focusable item in dialog
        GlobalFirstFocusableCreateAccountItem.get().focus();
        e.preventDefault()
        return;
    }
}