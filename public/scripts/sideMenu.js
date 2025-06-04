/*************************************************************************
 * File: sideMenu.js
 * These functions support interaction with the side menu.
 ************************************************************************/

/*************************************************************************
 * @function menuBtn click handler
 * @desc 
 * When the user clicks the menuBtn, open or close the side menu 
 * based on current menu state.
 *************************************************************************/
 GlobalMenuBtn
   .addEventListener("click", function (e) {
    if (GlobalMenuIcon.classList.contains("fa-bars")) { //OPEN MENU
        //Change menu icon
        GlobalMenuIcon.classList.remove("fa-bars");
        GlobalMenuIcon.classList.add("fa-times");
        //Open menu
        GlobalMenuBtn.setAttribute("aria-expanded","true"); 
        sideMenu.classList.add("sidemenu-open");

    } else { //CLOSE MENU
        //Change menu icon
        GlobalMenuIcon.classList.remove("fa-times");
        GlobalMenuIcon.classList.add("fa-bars");
        //Close menu
        GlobalMenuBtn.setAttribute("aria-expanded","false");
        GlobalMenu.classList.remove("sidemenu-open");
        //Focus menu button
        setTimeout(() => GlobalMenuBtn.focus(),1);
    }
});

/*************************************************************************
 * Menu items click handlers
 *************************************************************************/

//Settings menu item
GlobalMenuItems[0].addEventListener("click",function(e) {
     //Close menu
     GlobalMenuIcon.classList.remove("fa-times");
     GlobalMenuIcon.classList.add("fa-bars");
     GlobalMenuBtn.setAttribute("aria-expanded","false");
     GlobalMenu.classList.remove("sidemenu-open");
     const stateObj = {page: "PROFILE_DIALOG", path: "/editprofile"};
     transitionToDialog(GlobalProfileSettingsDialog, "Edit Account and Profile",
                       stateObj, GlobalCancelUpdateProfileBtn, populateProfileSettingsForm);
    GlobalProfileEmailField.focus();
});

//About menu item
GlobalMenuItems[1].addEventListener("click",function(e) {
    GlobalMenuBtn.click(); //Do nothing
});

//Log out menu item
GlobalMenuItems[2].addEventListener("click", async function(e) {
    //Close menu
    GlobalMenuIcon.classList.remove("fa-times");
    GlobalMenuIcon.classList.add("fa-bars");
    GlobalMenuBtn.setAttribute("aria-expanded","false");
    GlobalMenu.classList.remove("sidemenu-open");
    //Focus menu button
    setTimeout(() => GlobalMenuBtn.focus(),1);
    //Process pending requests...
    const responseObj = await api.processPendingRequests();
    let toastMsg = "";
    const results = responseObj.results;
    for (let i = 0; i < results.length; i++) {
        toastMsg += results[i].message;
        if (i < results.length - 1) {
            toastMsg += "<br>";
        }
    }
    const response = await api.logout();
    if (response.success) { //Complete logout...
        //Reset the global user data
        GlobalUserData = null;
        //Reset the app state
        clearRoundsTable();
        resetLogRoundForm();
        GlobalModeTabsContainer.classList.add("hidden");
        GlobalModeTabPanels[GlobalCurrentMode.get()].classList.add("hidden");
        GlobalMenuBtn.classList.add("hidden");
        GlobalMenu.classList.add("hidden");
        GlobalSearchBtn.classList.add("hidden");
        GlobalProfileBtn.classList.add("hidden");
        document.title = "Log in to SpeedScore";
        GlobalLoginPage.classList.remove("hidden");
        if (toastMsg !== "") {
            Toast.show(toastMsg, false);
        }
    } else {
        Toast.show("Error logging out: " + response.message + toastMsg, false);
    }

});

/*************************************************************************
* @function keyDownMenuBtnFocused
* @desc 
* Handle keypress when the menuBtn has the focus. Process 
* the arrow keys, space, and enter. All other keys are ignored.
* @param key
* The code of the key that was pressed.
*************************************************************************/
function keyDownMenuBtnFocused(key) {
    if (key === "ArrowDown" || key === "ArrowUp" ||
            key === "Space" || key === "Enter") {
            menuBtn.click(); //open menu
            if (key === "ArrowUp") { //Focus on last item
                GlobalFocusedMenuItem.set(GlobalMenuItems.length-1);
            } else { //Focus on first item
                GlobalFocusedMenuItem.set(0);
            }
            GlobalMenuItems[GlobalFocusedMenuItem.get()].focus();
        }
}

/*************************************************************************
* @function keyDownMenuItemFocused
* @desc 
* Handle keypress when menu is open and an item has focus. Per Table
* 4.1 from the book, we handle the following key presses: tab, enter
* escape, up arrow, down arrow, home, and end. 
* are the arrow keys, space, and enter. All other keys are ignored.
* @param key
* The code of the key that was pressed.
* @globals
 * GlobalFocusedMenuItem is the index of the currently focused menu item
 * GlobalMenuItems is an array of the HTML elements that are menu items   
 * menuBtn is a reference to the menu button HTML element
*************************************************************************/
function keyDownMenuItemFocused(key) {  
    if (key == "Enter") { //Activate focused menu item
        document.activeElement.click();
    } else if (key === "Tab") { //Close menu
       GlobalMenuBtn.click();
    } else if (key == "Escape") { //Close menu
        GlobalMenuBtn.click();
        GlobalMenuBtn.focus();
    } else if (key === "ArrowUp") {  //Focus on next item
        GlobalFocusedMenuItem.set((GlobalFocusedMenuItem.get() - 1 + GlobalMenuItems.length)
          % GlobalMenuItems.length);
        GlobalMenuItems[GlobalFocusedMenuItem.get()].focus();
    } else if (key === "ArrowDown") {  //Focus on prev item                                                                                                                                             
        GlobalFocusedMenuItem.set((GlobalFocusedMenuItem.get() + 1) % GlobalMenuItems.length);
        GlobalMenuItems[GlobalFocusedMenuItem.get()].focus();
    } else if (key === "Home") { //Focus on first item
        GlobalFocusedMenuItem.set(0);
        GlobalMenuItems[GlobalFocusedMenuItem.get()].focus();
    } else if (key === "End") { //Focus on last item
        GlobalFocusedMenuItem.set(GlobalMenuItems.length - 1);
        GlobalMenuItems[GlobalFocusedMenuItem.get()].focus();
    } 
}