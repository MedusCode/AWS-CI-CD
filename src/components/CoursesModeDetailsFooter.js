/*************************************************************************
 * CoursesModeDetailsFooter.js
 * This file defines the CoursesModeDetailsFooter React component, which
 * displays the "Save Changes" and "Cancel" buttons available from all
 * tabs of the CoursesModeDetails dialog. The closeCourseDetails function
 * prop is called when the user clicks on either button. If the user 
 * chooses to save changes, the updated course object is passed to the
 * function; otherwise, null is passed.
 ************************************************************************/
import {useCourse} from './CourseContext';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

export default function CoursesModeDetailsFooter({closeCourseDetails}) {
    const course = useCourse();

    return (    
        <div className="mode-page-btn-container">
            <button className="dialog-primary-btn"
                type="button" onClick={()=>closeCourseDetails(course)}>
                <FontAwesomeIcon icon="save"/>&nbsp;Save Changes 
            </button>
            <button className="dialog-cancel-btn" id="coursesModeDetailsCancelBtn"
                type="button" onClick={()=>closeCourseDetails(null, course.id)}>
                <FontAwesomeIcon icon="xmark"/>&nbsp;Cancel
            </button>
        </div>
    );
}