/*************************************************************************
 * File: document.js
 * These functions support interaction with the top-level document
 * element.
 ************************************************************************/

/*************************************************************************
 * @function keyDownDialogFocused 
 * @desc 
 * When the user presses a key with an element in a focused
 * dialog box, we implement the accessible keyboard interface for
 * a modal dialog box. This means that "Escape" dismisses the dialog and
 * that it is impossible to tab outside of the dialog box.

 * @param firstFocusableItem: References the first focusable
 *         item in the dialog. 
 * @parm cancelBtn: References "Cancel" button (last focusable 
 *         item in dialog)
 *************************************************************************/
function keyDownDialogFocused(e, firstFocusableItem, CancelBtn) {
    if (e.code === "Escape") {
        CancelBtn.click();
        return;
    }
    if (e.code === "Tab" && document.activeElement == firstFocusableItem &&
       e.shiftKey) {
        //shift focus to last focusable item in dialog
        CancelBtn.focus();
        e.preventDefault();
        return;
    }
    if (e.code === "Tab" && document.activeElement == CancelBtn &&
        !e.shiftKey) {
        //shift focus to first focusable item in dialog
        firstFocusableItem.focus();
        e.preventDefault()
        return;
    }
}

/*************************************************************************
 * @function Document Keydown Event Handler 
 * @desc 
 * When the user presses a key in the app, we interpret the
 * keypress based on which user interface element currently has focus. 
 *************************************************************************/
 document.addEventListener("keydown", function(e) { 
    if (document.activeElement.id === "menuBtn") {
        //User is pressing a key when menu button is focused
        keyDownMenuBtnFocused(e.code); 
    } else if (document.activeElement.getAttribute("role") 
               === "menuitem") {
        //User is pressing a key when menu item is focused
        keyDownMenuItemFocused(e.code);
    } else if (document.activeElement.getAttribute("role") 
               === "tab") {
        //User is pressing a key when mode tab is focused
        keyDownModeTabFocused(e.code); 
    } else if (document.activeElement.classList
        .contains("action-dialog")) {
            keyDownModeDialogFocused(e);
    } else if (GlobalCreateAccountDialog.contains(document.activeElement)) {
        keyDownDialogFocused(e,GlobalFirstFocusableCreateAccountItem.get(),GlobalCancelCreateAccountBtn);
    }  else if (GlobalProfileSettingsDialog.contains(document.activeElement)) {
        keyDownDialogFocused(e,GlobalFirstFocusableUpdateProfileItem.get(),GlobalCancelUpdateProfileBtn);
    }
 });