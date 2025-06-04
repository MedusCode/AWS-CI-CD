/*************************************************************************
 * @file window.js
 * @desc
 * This file defines functions that allow the user to use the browser's
 * back and forward buttons to navigate the application. The application
 * maintains a history stack that contains objects representing the state
 * of the application at different points in time. The state object has
 * two properties: page and path. The page property represents the page
 * the user is on and the path property represents the URL path. The
 * application's initial state is the login page. The application's state
 * is updated when the user navigates to a different page. The application
 * also listens for the popstate event, which is triggered when the user
 * navigates to a different point in the history stack. The application
 * restores the state of the application to the state object associated
 * with the history entry. 
 * *************************************************************************/

// redirectComplete is a Promise that resolves when the redirectListener
// has finished processing the redirect. This is necessary because the
// redirectListener must process the redirect before the window.load
// event listener can establish the initial state of the application.
window.redirectComplete = new Promise((resolve) => {
  window.resolveRedirect = resolve;
});

/*************************************************************************
 * @function restoreState
 * @desc
 * This function restores the state of the application to the state object
 * associated with the history entry.
 * @param {Object} state - The state object associated with the history
 * entry.
 * *************************************************************************/
function restoreState(state) {
  GlobalHistoryLogging = false;
  console.log('Console: In restoreState: state:', JSON.stringify(state));
  if (GlobalDialogClose) {
    if (typeof GlobalDialogClose === 'string') {
      console.log('Console: In restoreState: Closing dialog: ', GlobalDialogClose);
      document.getElementById(GlobalDialogClose).click();
    } else { //GlobalCloseDialog instanceof HTMLElement 
      console.log('Console: In restoreState: Closing dialog:', GlobalDialogClose.id);
      GlobalDialogClose.click();
    }
    GlobalDialogClose = null;
  }
  switch (state.page) {
  case "MODE_DIALOG":
    GlobalModeActionButtons[state.mode].click();
    GlobalDialogClose = GlobalDialogCancelButtons[state.mode];
  break;
  case "PROFILE_DIALOG":
    GlobalMenuItems[0].click();
    GlobalDialogClose = GlobalCancelUpdateProfileBtn;
  break;
  case "LOGIN":
    GlobalMenuItems[2].click();
  break;
  case "ACTIVITY_FEED":
    GlobalModeTabButtons[0].click();
    GlobalModeTabButtons[0].focus();
    break;
  case "ROUNDS":
    GlobalModeTabButtons[1].click();
    GlobalModeTabButtons[1].focus();
    break;
  case "COURSES":
    GlobalModeTabButtons[2].click();
    GlobalModeTabButtons[2].focus();
    break;
  case "BUDDIES":
    GlobalModeTabButtons[3].click();
    GlobalModeTabButtons[3].focus();
    break;
  case "VIEW_EDIT_ROUND":
    const roundId = state.path.split("/")[2];
    editRound(roundId);
    GlobalDialogClose = GlobalDialogCancelButtons[1];
  break;
  case "ADD_COURSE":
    const addBtn = document.getElementById("coursesModeAddBtn");
    console.log('Console: In restoreState: Clicking button:', btn);
    addBtn.click();
    GlobalDialogClose = "coursesModeCancelBtn";
  break;
  case "COURSE_DETAILS":
    const courseId = state.path.split("/")[2];
    const detailsBtn = document.getElementById(courseId);
    detailsBtn.click();
    GlobalDialogClose = "coursesModeDetailsCancelBtn";

  default:
    console.log('Console: In restoreState: Restoration not implemented for this page value:', JSON.stringify(state.page));
    break;  
  }
  GlobalHistoryLogging = true;
}


/*************************************************************************
 * @desc The 'load' listener is responsible for establishing the initial
 * state of the application and pushing it to the history stack.
 * **********************************************************************/
window.addEventListener('load', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Handle redirects first if present
  if (urlParams.has('id') || urlParams.has('emailverified') || urlParams.has('emailVerified')) {
    // Let redirectListener handle the params first
    await window.redirectComplete;
  }
  
  // Always establish initial state after redirects are processed
  const initialState = { page: "LOGIN", path: "/" };
  history.pushState(initialState, "", "/");
  console.log('Console: In window load: Pushing state:', JSON.stringify(initialState));
});

/*************************************************************************
 * @desc The 'popstate' listener is responsible for restoring the state of
 * the application to the state object associated with the history entry.
 * *************************************************************************/
window.addEventListener('popstate', (event) => {
  console.log('Console: In popstate: state:', JSON.stringify(event.state), " & location ", document.location.href);
  if (!event.state) {
    console.log('Console: In popstate: No state associated with this history entry.');
    return;
  }
  console.log('Console: In popstate: Restoring this state:', JSON.stringify(event.state));
   if (event.state.path) {
    restoreState(event.state);
    console.log('Console: In popstate: URL updated to:', event.state.path);
  } else {
    console.log('Console: In popstate: State object does not contain a valid path:', event.state);
  }

});