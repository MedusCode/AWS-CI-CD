/*************************************************************************
 * CoursesModeDetailsHeader.js
 * This file defines the CoursesModeDetailsHeader React component, which
 * displays the name of the course whose details are being displayed.
 ************************************************************************/
import {useCourse} from './CourseContext'; 

export default function CoursesModeDetailsHeader() {
    const course = useCourse();

    return (    
      <>
        <h1 className="centered">{course.shortName}</h1>
      </>
    );
}