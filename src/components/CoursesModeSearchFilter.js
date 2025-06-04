import {useState} from 'react';
 
 /*************************************************************************
 * File: coursesModeSearch.js
 * This file defines the CoursesModeSearch React component, which allows
 * users to search for and filter golf courses
 ************************************************************************/

export default function CoursesModeSearchFilter({updateDisplayedCourses}) {

    const [searchBoxContents, setSearchBoxContents] = useState("");
    const [searchScope, setSearchScope] = useState("Name")
    
    function handleSearchBoxChange(event) {
        setSearchBoxContents(event.target.value);
        updateDisplayedCourses(event.target.value,searchScope)
    }

    function handleOptionChange(event) {
        setSearchScope(event.target.value);
        updateDisplayedCourses(searchBoxContents, event.target.value)
    }

    return (
      <>
        <div className="container d-flex justify-content-center align-items-center">
            <label className="form-label" htmlFor="searchBox">Search/Filter:&nbsp;</label>
            <div className="w-50">
            <input  className="form-control" id="searchBox"
                    aria-label="Search Courses" 
                    type="search" value={searchBoxContents}
                    onChange={handleSearchBoxChange}/>
            </div>
        </div>
        <div className="radio-centered">
            <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" 
                    id="courseName" aria-label="Course Name Radio Button" 
                    value="Name" checked={searchScope === "Name"} 
                    onChange={handleOptionChange} />
                <label className="form-check-label" htmlFor="courseName">Name</label>
        </div>
        <div className="form-check form-check-inline">
            <input className="form-check-input" type="radio" 
                   id="courseState" aria-label="Course State Radio Button" 
                   value="State" checked={searchScope === "State"} 
                   onChange={handleOptionChange} />
            <label className="form-check-label" htmlFor="courseState">State/Province</label>
        </div>
        <div className="form-check form-check-inline">
            <input className="form-check-input" type="radio" 
                   id="courseCountry" aria-label="Course Country Radio Button" 
                   value="Country" checked={searchScope === "Country"} 
                   onChange={handleOptionChange} />
            <label className="form-check-label" htmlFor="courseCountry">Country</label>
        </div>
        </div>
      </> 
    );
 };