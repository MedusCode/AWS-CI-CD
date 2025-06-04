/*************************************************************************
 * File: CoursesModeDetails.js
 * This file defines the CoursesModeDetails react component, which 
 * implements the "Details" page of SpeedScore's "Courses" mode
 ************************************************************************/
import {CourseProvider} from './CourseContext'; /* NEW */
import CoursesModeDetailsCourseInfo from './CoursesModeDetailsCourseInfo';
import CoursesModeDetailsSGInfo from './CoursesModeDetailsSGInfo';
import CoursesModeDetailsScorecard from './CoursesModeDetailsScorecard';
import CoursesModeDetailsHeader from './CoursesModeDetailsHeader';
import CoursesModeDetailsFooter from './CoursesModeDetailsFooter';

export default function CoursesModeDetails({currentCourse, closeCourseDetails}) {

return(
  <CourseProvider initialCourse={currentCourse}>
    <section>
      <CoursesModeDetailsHeader />
      <span id="details-tabs-label" hidden>Course Details dialog tabs</span>
        <ul className="nav nav-tabs" id="myTab" role="tablist" 
            aria-labelledby='details-tabs-label'>
            <li className="nav-item" role="presentation">
                <button className="nav-link active" 
                        id="courseInfo-tab" data-bs-toggle="tab" data-bs-target="#basic-info" 
                        type="button" role="tab" aria-controls="basic-info" 
                        aria-selected="true">
                    Course Info
                </button>
            </li>
            <li className="nav-item" role="presentation">
                <button className="nav-link" id="sgInfo-tab" 
                        data-bs-toggle="tab" data-bs-target="#speedgolf-info" 
                        type="button" role="tab" aria-controls="speedgolf-info" 
                        aria-selected="false">
                    Speedgolf Info
                </button>
            </li>
            <li className="nav-item" role="presentation">
                <button className="nav-link"
                        id="scorecard-tab" 
                        data-bs-toggle="tab" data-bs-target="#scorecard"
                        type="button" role="tab" aria-controls="scorecard"
                        aria-selected="false">
                    Scorecard
                </button>
            </li>
        </ul>
        <div className="tab-content" id="detailsTabContent">
            <div className="tab-pane fade show active" id="basic-info" role="tabpanel" aria-labelledby="home-tab">
                <CoursesModeDetailsCourseInfo /> 
            </div>
            <div className="tab-pane fade" id="speedgolf-info" role="tabpanel" aria-labelledby="speedgolf-tab">
                <CoursesModeDetailsSGInfo /> 
            </div>
            <div className="tab-pane fade" id="scorecard" role="tabpanel" aria-labelledby="scorecard-tab">
                <CoursesModeDetailsScorecard />
            </div>      
        </div>
        <CoursesModeDetailsFooter closeCourseDetails={closeCourseDetails} />
    </section> 
  </CourseProvider>
);
}