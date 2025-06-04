/*************************************************************************
 * File: editProfile.js
 * This file contains functions that support the "Account and Profile
 * Settings" Dialog.
 ************************************************************************/


 /*************************************************************************
 * @function profilePicField CHANGE Handler 
 * @Desc 
 * When the user finishes interacting with the File picker dialog box,
 * update the user's profile picture based on the selection from the
 * file picker. If the user cancels out of the File Picker, the input
 * element's value will be empty and we set the profile picture to the
 * default picture.
 * @global profilePicField: The "Update Profile" form field 
 *         containing the optional profile picture
 * @global profilePicImage: The "Update Profile" <img> element that
 *         displays the user's profile picture (possibly the default)
 *************************************************************************/
  GlobalProfilePicField.addEventListener("change",function(e) {
    if (GlobalProfilePicField.value.length !== 0) {
        const reader = new FileReader();
        reader.readAsDataURL(GlobalProfilePicField.files[0]);
        reader.addEventListener("load",function() {
            GlobalProfilePicImage.setAttribute("src",this.result);
        });
    } else {
        GlobalProfilePicImage.setAttribute("src",GlobalDefaultProfilePic);
    }
});

/*************************************************************************
 * @function resetupdateProfileForm 
 * @Desc 
 * When the user exits the "Update Profile" Dialog, reset the form to
 * blank in case the form is visited again.
 * @global GlobalProfileEmailFiled: Form's email field
 * @global GlobalProfilePasswordField: Form's password field
 * @global GlobalProfileDisplayNameField: Form's display name field
 * @global GlobalProfileSecurityQuestionField: Form's security q field
 * @global GlobalProfileSecurityAnswerField: Form's security answ field
 * @global GlobalProfileErrBox: <div> containing the error messages
 * @global GlobalProfileEmailErr: Error message for email field
 * @global GlobalProfilePasswordErr: Error message for password field
 * @global GlobalProfileDisplaynameErr: Error message for display name field
 * @global GlobalProfileSecurityQuestionErr: Error message for security q field
 * @global GlobalProfileSecurityAnswerErr: Error message for security answ field
 *************************************************************************/
 function resetUpdateProfileForm() {
    //Hide errors
    GlobalProfileErrBox.classList.add("hidden");
    GlobalProfileEmailErr.classList.add("hidden");
    GlobalProfileDisplayNameErr.classList.add("hidden");

    //Blank out account info
    GlobalProfileEmailField.value = "";
    GlobalProfilePasswordField.value = "";

    //Blank out Identity info
    GlobalProfileDisplayNameField.value = "";
    GlobalProfilePicField.value = "";
    GlobalProfilePicImage.setAttribute("src",GlobalDefaultProfilePic);
    //Blank out Speedgolf info
    GlobalProfileBioField.value = "";
    GlobalProfileFirstRoundField.value = "";
    GlobalProfileHomeCourseField.value = "";
    GlobalProfileBestStrokesField.value = "";
    GlobalProfileBestMinutesField.value = "";
    GlobalProfileBestSecondsField.value = "";
    GlobalProfileBestCourseField.value = "";
    for (let i = 0; i < GlobalAllClubs.length; ++i) {
        document.getElementById("sg"+ GlobalAllClubs[i]).checked = false;
    }
    GlobalProfileClubCommentsField.value = "";
    //Set first focusable item.
    GlobalFirstFocusableUpdateProfileItem.set(GlobalProfileEmailField);
    //Expand only the first accordion panel
    GlobalAccountSettingsBtn.classList.remove("collapsed");
    GlobalAccountSettingsPanel.classList.add("show");
    GlobalProfileSettingsBtn.classList.add("collapsed");
    GlobalProfileSettingsPanel.classList.remove("show");
    GlobalsgSettingsBtn.classList.add("collapsed");
    GlobalsgSettingsPanel.classList.remove("show");
}

/*************************************************************************
 * @function populateProfileSettingsForm 
 * @Desc 
 * Populates the "Account and Profile Settings" dialog form with the 
 * current user's data. 
 * The following global vars are used to access fields in the form
 *  @global GlobalProfileEmailField
 *  @global GlobalProfilePasswordField
 *  @global GlobalProfileSecurityQuestionField
 *  @global GlobalProfileSecurityAnswerField
 *  @global GlobalProfileDisplayNameField
 *  @global GlobalProfilePicImage
 *  @global GlobalProfileBioField    
 *  @global GlobalProfileBestStrokesField
 *  @global GlobalProfileBestMinutesField
 *  @global GlobalProfileBestSecondsField
 *  @global GlobalProfileBestCourseField
 *************************************************************************/
 function populateProfileSettingsForm() {
    GlobalProfileEmailField.value = GlobalUserData.accountInfo.email;
    GlobalProfilePasswordField.value = GlobalUserData.accountInfo.password;
    GlobalProfileOAuthProviderField.value = GlobalUserData.accountInfo.oauthProvider;
    GlobalProfileRoleField.value = GlobalUserData.accountInfo.role;
    GlobalProfileDisplayNameField.value = GlobalUserData.identityInfo.displayName;
    GlobalProfilePicImage.setAttribute("src",GlobalUserData.identityInfo.profilePic);
    GlobalProfileBioField.value = GlobalUserData.speedgolfInfo.bio;
    GlobalProfileHomeCourseField.value = GlobalUserData.speedgolfInfo.homeCourse;
    GlobalProfileFirstRoundField.value = GlobalUserData.speedgolfInfo.firstRound;
    GlobalProfileBestStrokesField.value = (GlobalUserData.speedgolfInfo.personalBest.strokes === 0 ? "" : GlobalUserData.speedgolfInfo.personalBest.strokes);
    GlobalProfileBestMinutesField.value =  (GlobalUserData.speedgolfInfo.personalBest.seconds === 0 ? "" : Math.floor(GlobalUserData.speedgolfInfo.personalBest.seconds / 60));
    GlobalProfileBestSecondsField.value = (GlobalUserData.speedgolfInfo.personalBest.seconds === 0 ? "" : GlobalUserData.speedgolfInfo.personalBest.seconds % 60);
    GlobalProfileBestCourseField.value = GlobalUserData.speedgolfInfo.personalBest.course;   
    for (const club in GlobalUserData.speedgolfInfo.clubs) {
        if (GlobalUserData.speedgolfInfo.clubs[club]) {
            document.getElementById("sg" + club).checked = true;
        }
    }
    GlobalProfileClubCommentsField.value = GlobalUserData.speedgolfInfo.clubComments;
    GlobalProfileEmailField.focus(); //Set focus to first field.
}

/*************************************************************************
 * @function profileBtn CLICK Handler 
 * @Desc 
 * When the user clicks their profile picture, hide the menu button, tabs,
 * and current tab panel, and show the "Account and Profile Settings" Dialog
 * @global GlobalMenuBtn: The menu button
 * @global GlobalModeTabsContainer: The mode tabs
 * @global GlobalModeTabPanels: array of tab panels 
 * @global GlobalCurrentMode, index of current mode.
 * @global GlobalProfileSettingsDialog: The "Account and Profile Settings" 
 *         dialog
 *************************************************************************/
 GlobalProfileBtn.addEventListener("click", function(e) {
    const stateObj = {page: "PROFILE_DIALOG", path: "/editprofile"};
    transitionToDialog(GlobalProfileSettingsDialog, "Edit Account and Profile",
                       stateObj, GlobalCancelUpdateProfileBtn, populateProfileSettingsForm);
    GlobalProfileEmailField.focus();
});

/*************************************************************************
 * @function updateProfile
 * @Desc 
 * Given valid profile data in the form, update the current user's
 * object. 
 * @global menuBtn: The menu button
 * @global modeTabsContainer: The mode tabs
 * @global modeTabPanels: array of tab panels 
 * @global currentMode, index of current mode.
 * @global profileSettingsDialog: The "Account and Profile Settings" 
 *         dialog
 *************************************************************************/
 async function updateProfile() {
    let clubsInBag = {};
    for (let i = 0; i < GlobalProfileClubsInBagChecks.length; ++i) {
        if (GlobalProfileClubsInBagChecks[i].checked) {
            clubsInBag[GlobalProfileClubsInBagChecks[i].name] = true;
        }
        else {
            clubsInBag[GlobalProfileClubsInBagChecks[i].name] = false;
        }
    }
    const oldUserEmail = GlobalUserData.accountInfo.email;
    const updatedUser = {
        accountInfo: {
            email: GlobalProfileEmailField.value,
            oauthProvider: GlobalProfileOAuthProviderField.value,
            role: GlobalProfileRoleField.value,
        },
        identityInfo: {
            displayName: GlobalProfileDisplayNameField.value,
            profilePic: GlobalProfilePicImage.getAttribute("src"),
        },
        speedgolfInfo: {
            bio: GlobalProfileBioField.value,
            firstRound: GlobalProfileFirstRoundField.value,
            homeCourse: GlobalProfileHomeCourseField.value,
            personalBest: {
                strokes: (GlobalProfileBestStrokesField.value === "" ? 0 :GlobalProfileBestStrokesField.value),
                seconds: (GlobalProfileBestMinutesField.value === "" && 
                          GlobalProfileBestSecondsField.value === "" ? 0 : 
                            (Number(GlobalProfileBestMinutesField.value) * 60) + 
                             Number(GlobalProfileBestSecondsField.value)), 
                course: GlobalProfileBestCourseField.value},
            clubs: clubsInBag,
            clubComments: GlobalProfileClubCommentsField.value
        },
    };
    //Save updated user data to database
    Spinner.show();
    const result = await api.updateUser(updatedUser);
    Spinner.hide();
    if (result.success) {
        //Update GlobalUserData object with new data
        GlobalUserData.accountInfo = updatedUser.accountInfo;
        GlobalUserData.identityInfo = updatedUser.identityInfo;
        GlobalUserData.speedgolfInfo = updatedUser.speedgolfInfo;  
        Toast.show(result.message,true);    
    } else {
        Toast.show("Error updating profile: " + result.message, true);
    }
    //Reset form in case it is visited again
    resetUpdateProfileForm();
    //Transition back to previous mode page
    // Update profile pic in case it has changed
    GlobalProfileBtn.style.backgroundImage = "url(" + GlobalUserData.identityInfo.profilePic + ")";
    const path = "/" + GlobalModeNames[GlobalCurrentMode.get()].toLowerCase().replace(/\s+/g, '');
    transitionFromDialog(GlobalProfileSettingsDialog);
}

/*************************************************************************
 * @function submit button CLICK Handler 
 * @Desc 
 * When the user clicks the form's "Update" (submit) button, we need to
 * validate the form data. If it's valid, we update the current user's
 * object
 * @global GlobalMenuBtn: The menu button
 * @global GlobalModeTabsContainer: The mode tabs
 * @global GlobalModeTabPanels: array of tab panels 
 * @global GlobalCurrentMode, index of current mode.
 * @global GlobalProfileSettingsDialog: The "Account and Profile Settings" 
 *         dialog
 *************************************************************************/
 editProfileForm.addEventListener("submit",function(e) {
    e.preventDefault(); //Prevent default submit behavior
    //Is the email field valid?
    let emailValid = !GlobalProfileEmailField.validity.typeMismatch && 
                        !GlobalProfileEmailField.validity.valueMissing;
    //Is display field valid?
    let displayNameValid = !GlobalProfileDisplayNameField.validity.tooShort &&
                            !GlobalProfileDisplayNameField.validity.valueMissing;
    if (emailValid && displayNameValid) { 
        //All is well -- Call updateProfile()
        updateProfile();
        return;
    }
    //If here, at least one field is invalid: Display the errors
    //and allow user to fix them.
    GlobalProfileErrBox.classList.remove("hidden");
    if (!emailValid) {
        //expand account panel
        accountSettingsBtn.classList.remove("collapsed");
        accountSettingsPanel.classList.add("show");
    } else {
        //collapse account panel
        accountSettingsBtn.classList.add("collapsed");
        accountSettingsPanel.classList.remove("show");
    }
    if (!displayNameValid) {
        //expand Profile panel
        GlobalProfileSettingsBtn.classList.remove("collapsed");
        GlobalProfileSettingsPanel.classList.add("show");
    } else {
        //collapse account panel
        GlobalProfileSettingsBtn.classList.add("collapsed");
        GlobalProfileSettingsPanel.classList.remove("show");
    }
    //Speedgolf Settings Panel always collapsed
    GlobalsgSettingsBtn.classList.add("collapsed");
    GlobalsgSettingsPanel.classList.remove("show");
    document.title = "Error: Update Account & Profile";
    if (!displayNameValid) { //Display name field is invalid
        GlobalProfileDisplayNameErr.classList.remove("hidden");
        GlobalProfileDisplayNameErr.focus();
        GlobalFirstFocusableUpdateProfileItem.set(GlobalProfileDisplayNameField);
    } else {
        GlobalProfileDisplayNameErr.classList.add("hidden");
    } 
    if (!emailValid) { //Email field is invalid
        GlobalProfileEmailErr.classList.remove("hidden");
        GlobalProfileEmailErr.focus();
        GlobalFirstFocusableUpdateProfileItem.set(GlobalProfileEmailErr);
    } else {
        GlobalProfileEmailErr.classList.add("hidden");
    }
 });

 cancelUpdateProfileBtn.addEventListener("click", function(e) {
    //Reset form in case it is visited again
    resetUpdateProfileForm();
    //Transition back to previous mode page
    transitionFromDialog(GlobalProfileSettingsDialog);
 });