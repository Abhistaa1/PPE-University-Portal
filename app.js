// =====================================================
// PERSONAL UNIVERSITY PORTAL
// app.js
// COMPLETE REPLACEMENT
// =====================================================


// =====================================================
// 1. CONSTANTS
// =====================================================

const STORAGE_KEY = "ppe_completed_sessions";

const DAILY_STUDY_LIMIT_SECONDS =
    2 * 60 * 60;


// =====================================================
// 2. PERSISTENT STATE
// =====================================================

function loadJSON(key, fallback = {}) {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);
    } catch (error) {
        console.error(
            `Could not load ${key}:`,
            error
        );

        return fallback;
    }
}

function saveJSON(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    } catch (error) {
        console.error(
            `Could not save ${key}:`,
            error
        );
    }
}


// Completed session state
let completedSessions =
    loadJSON(
        STORAGE_KEY,
        {}
    );


// Semester state
let semesterStarted =
    localStorage.getItem(
        "semester_started"
    ) === "true";

let semesterStartDate =
    localStorage.getItem(
        "semester_start_date"
    ) || null;


// Lecture progress
let progressState =
    loadJSON(
        "ppe_progress_state",
        {}
    );


// Watched lecture state
let watchedState =
    loadJSON(
        "ppe_watched_state",
        {}
    );


// Attendance state
let attendanceState =
    loadJSON(
        "ppe_attendance_state",
        {}
    );


// Application data
let currentWeek = "1";

let syllabusData = {};

let courseCatalog = {};

let appSettings = {};


// =====================================================
// 3. DOM REFERENCES
// =====================================================

const courseListEl =
    document.getElementById(
        "courseList"
    );

const progressFillEl =
    document.getElementById(
        "progressFill"
    );

const weekSelector =
    document.getElementById(
        "weekSelector"
    );

const completionRateBadge =
    document.getElementById(
        "completionRateBadge"
    );

const statCompletedEl =
    document.getElementById(
        "statCompleted"
    );

const statRemainingEl =
    document.getElementById(
        "statRemaining"
    );

const statCurrentWeekEl =
    document.getElementById(
        "statCurrentWeek"
    );


// =====================================================
// 4. STORAGE
// =====================================================

function saveState() {

    saveJSON(
        "ppe_progress_state",
        progressState
    );

    saveJSON(
        "ppe_watched_state",
        watchedState
    );

    saveJSON(
        "ppe_attendance_state",
        attendanceState
    );

    saveJSON(
        STORAGE_KEY,
        completedSessions
    );
}


// =====================================================
// 5. TAB CONTROLLER
// =====================================================

window.switchTab = function (tabId) {

    document
        .querySelectorAll(
            ".tab-content"
        )
        .forEach(
            element => {
                element.classList.remove(
                    "active"
                );
            }
        );

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            element => {
                element.classList.remove(
                    "active"
                );
            }
        );

    const target =
        document.getElementById(
            tabId
        );

    if (target) {
        target.classList.add(
            "active"
        );
    }

    const indexMap = {
        trackerTab: 0,
        playlistTab: 1,
        syllabusTab: 2,
        profileTab: 3
    };

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    const index =
        indexMap[tabId];

    if (
        index !== undefined &&
        navItems[index]
    ) {
        navItems[index].classList.add(
            "active"
        );
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};


// =====================================================
// 6. DATE HELPERS
// =====================================================

function parseDateOnly(
    dateString
) {

    if (!dateString) {
        return new Date("Invalid");
    }

    const parts =
        String(dateString)
            .split("-")
            .map(Number);

    if (
        parts.length !== 3 ||
        parts.some(
            Number.isNaN
        )
    ) {
        return new Date("Invalid");
    }

    const [
        year,
        month,
        day
    ] = parts;

    return new Date(
        year,
        month - 1,
        day,
        0,
        0,
        0,
        0
    );
}


function toISODate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
}


function formatDate(date) {

    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "TBD";
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatDateLong(date) {

    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "TBD";
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


// =====================================================
// 7. LIVE HEADER DATE
// =====================================================

function updateCurrentDateDisplay() {

    const element =
        document.getElementById(
            "currentDateDisplay"
        );

    if (!element) {
        return;
    }

    const today =
        new Date();

    element.textContent =
        today.toLocaleDateString(
            "en-GB",
            {
                weekday: "long",
                day: "2-digit",
                month: "long"
            }
        );
}


// =====================================================
// 8. TIME HELPERS
// =====================================================

function parseTime(
    timeString
) {

    const parts =
        String(
            timeString || "00:00"
        )
        .split(":")
        .map(Number);

    return {
        hour:
            Number.isFinite(
                parts[0]
            )
                ? parts[0]
                : 0,

        minute:
            Number.isFinite(
                parts[1]
            )
                ? parts[1]
                : 0
    };
}


// =====================================================
// 9. DAY HELPERS
// =====================================================

const DAY_MAP = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
};


function getDayNumber(
    dayName
) {

    return DAY_MAP[
        String(
            dayName || ""
        ).trim()
    ];
}


// =====================================================
// 10. SEMESTER CALENDAR
// =====================================================

function getWeekStartDate(
    weekNumber
) {

    if (!semesterStartDate) {
        return null;
    }

    const start =
        parseDateOnly(
            semesterStartDate
        );

    if (
        Number.isNaN(
            start.getTime()
        )
    ) {
        return null;
    }

    const result =
        new Date(start);

    result.setDate(
        start.getDate() +
        (
            (
                Number(
                    weekNumber
                ) - 1
            ) * 7
        )
    );

    return result;
}


function getCourseDate(
    weekNumber,
    dayName
) {

    if (!semesterStartDate) {
        return null;
    }

    const startDate =
        parseDateOnly(
            semesterStartDate
        );

    if (
        Number.isNaN(
            startDate.getTime()
        )
    ) {
        return null;
    }

    const originalDay =
        getDayNumber(
            dayName
        );

    if (
        originalDay === undefined ||
        originalDay === 0 ||
        originalDay === 6
    ) {
        return null;
    }

    /*
     * Week 1 begins on the exact
     * Start Study date.
     *
     * The syllabus weekday determines
     * the position within the
     * Monday-Friday study sequence.
     */

    const dayIndex =
        originalDay - 1;

    const totalStudyDayIndex =
        (
            Number(
                weekNumber
            ) - 1
        ) * 5 +
        dayIndex;

    const result =
        new Date(
            startDate
        );

    let remainingDays =
        totalStudyDayIndex;

    while (
        remainingDays > 0
    ) {

        result.setDate(
            result.getDate() + 1
        );

        const day =
            result.getDay();

        if (
            day !== 0 &&
            day !== 6
        ) {
            remainingDays--;
        }
    }

    while (
        result.getDay() === 0 ||
        result.getDay() === 6
    ) {

        result.setDate(
            result.getDate() + 1
        );
    }

    return result;
}


// =====================================================
// 11. VIDEO HELPERS
// =====================================================

function formatDuration(
    seconds
) {

    if (
        seconds === undefined ||
        seconds === null ||
        Number.isNaN(
            Number(seconds)
        )
    ) {
        return "";
    }

    const total =
        Math.round(
            Number(seconds)
        );

    const hours =
        Math.floor(
            total / 3600
        );

    const minutes =
        Math.floor(
            (
                total % 3600
            ) / 60
        );

    const secondsLeft =
        total % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (secondsLeft > 0) {
        return `${minutes}m ${secondsLeft}s`;
    }

    return `${minutes}m`;
}


function getVideo(
    courseCode,
    videoId
) {

    const course =
        courseCatalog[
            courseCode
        ];

    if (
        !course ||
        !Array.isArray(
            course.videos
        )
    ) {
        return null;
    }

    return course.videos.find(
        video =>
            video.id === videoId
    ) || null;
}


function getLectureNumber(
    video
) {

    if (!video) {
        return null;
    }

    if (
        video.lectureNumber !==
            undefined &&
        video.lectureNumber !==
            null
    ) {
        return video.lectureNumber;
    }

    if (
        video.number !==
            undefined &&
        video.number !==
            null
    ) {
        return video.number;
    }

    return null;
}


function getDisplayLectureTitle(
    video
) {

    if (!video) {
        return "";
    }

    let title =
        String(
            video.displayTitle ||
            video.title ||
            ""
        ).trim();


    // Remove "01. "
    title =
        title.replace(
            /^\s*\d+\s*\.\s*/,
            ""
        );


    // Remove "Lecture 1: "
    title =
        title.replace(
            /^\s*Lecture\s*#?\s*\d+\s*[:.\-]\s*/i,
            ""
        );


    // Remove "1: "
    title =
        title.replace(
            /^\s*\d+\s*[:\-]\s+/,
            ""
        );


    return title.trim();
}


function getSessionVideos(
    session
) {

    if (
        !session ||
        !Array.isArray(
            session.lectureIds
        )
    ) {
        return [];
    }

    return session.lectureIds
        .map(
            id =>
                getVideo(
                    session.code,
                    id
                )
        )
        .filter(Boolean);
}


// =====================================================
// 12. 2-HOUR DAILY STUDY PLANNER
// =====================================================

function getPlannedSessionDuration(
    session
) {

    if (!session) {
        return 0;
    }


    // Prefer the complete session workload.
    if (
        session.sessionDurationSeconds !==
            undefined &&
        session.sessionDurationSeconds !==
            null &&
        Number(
            session.sessionDurationSeconds
        ) > 0
    ) {
        return Number(
            session.sessionDurationSeconds
        );
    }


    // Otherwise use total video duration.
    return getSessionVideos(
        session
    ).reduce(
        (
            total,
            video
        ) =>
            total +
            (
                Number(
                    video.durationSeconds
                ) > 0
                    ? Number(
                        video.durationSeconds
                    )
                    : 0
            ),
        0
    );
}


function nextStudyDay(
    date
) {

    const result =
        new Date(date);

    do {

        result.setDate(
            result.getDate() + 1
        );

    } while (
        result.getDay() === 0 ||
        result.getDay() === 6
    );

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


function normaliseStudyDay(
    date
) {

    const result =
        new Date(date);

    result.setHours(
        0,
        0,
        0,
        0
    );

    while (
        result.getDay() === 0 ||
        result.getDay() === 6
    ) {

        result.setDate(
            result.getDate() + 1
        );
    }

    return result;
}


/*
 * Builds a complete study plan.
 *
 * Maximum:
 *      2 hours per study day.
 *
 * Sessions are NEVER split.
 *
 * Example:
 *
 * Monday:
 *   1h 25m
 *
 * Next session = 1h 10m
 *
 * 1h25 + 1h10 > 2h
 *
 * Therefore:
 *
 * Monday:
 *   1h25
 *
 * Tuesday:
 *   1h10
 */

function buildStudyPlan() {

    const plan =
        new Map();


    if (
        !semesterStarted ||
        !semesterStartDate
    ) {
        return plan;
    }


    const sessions = [];


    Object.keys(
        syllabusData
    )
    .sort(
        (
            a,
            b
        ) =>
            Number(a) -
            Number(b)
    )
    .forEach(
        week => {

            const items =
                syllabusData[
                    week
                ] || [];


            items.forEach(
                (
                    session,
                    index
                ) => {

                    const anchorDate =
                        getCourseDate(
                            session.week ||
                                week,
                            session.day
                        );


                    if (!anchorDate) {
                        return;
                    }


                    sessions.push({
                        session,
                        week:
                            Number(week),
                        index,
                        anchorDate:
                            normaliseStudyDay(
                                anchorDate
                            )
                    });

                }
            );

        }
    );


    // Preserve syllabus chronology.
    sessions.sort(
        (
            a,
            b
        ) => {

            const dateDifference =
                a.anchorDate.getTime() -
                b.anchorDate.getTime();


            if (
                dateDifference !== 0
            ) {
                return dateDifference;
            }


            if (
                a.week !== b.week
            ) {
                return (
                    a.week -
                    b.week
                );
            }


            return (
                a.index -
                b.index
            );
        }
    );


    let currentDate = null;

    let usedSeconds = 0;


    sessions.forEach(
        item => {

            const duration =
                getPlannedSessionDuration(
                    item.session
                );


            let plannedDate =
                new Date(
                    item.anchorDate
                );


            /*
             * Never move backwards.
             */

            if (
                currentDate &&
                plannedDate.getTime() <
                    currentDate.getTime()
            ) {

                plannedDate =
                    new Date(
                        currentDate
                    );
            }


            plannedDate =
                normaliseStudyDay(
                    plannedDate
                );


            /*
             * Hard 2-hour daily limit.
             *
             * Whole sessions only.
             */

            if (
                usedSeconds > 0 &&
                duration > 0 &&
                (
                    usedSeconds +
                    duration
                ) >
                    DAILY_STUDY_LIMIT_SECONDS
            ) {

                plannedDate =
                    nextStudyDay(
                        plannedDate
                    );

                usedSeconds = 0;
            }


            if (
                !currentDate ||
                plannedDate.getTime() !==
                    currentDate.getTime()
            ) {

                usedSeconds = 0;
            }


            plan.set(
                item.session.id,
                {
                    date:
                        new Date(
                            plannedDate
                        ),

                    durationSeconds:
                        duration
                }
            );


            usedSeconds +=
                duration;


            currentDate =
                new Date(
                    plannedDate
                );

        }
    );


    return plan;
}


function getPlannedSessionDate(
    session
) {

    if (!session) {
        return null;
    }

    const entry =
        buildStudyPlan().get(
            session.id
        );

    return entry
        ? entry.date
        : null;
}


function getDailyStudyLoad(
    date
) {

    if (!date) {
        return 0;
    }

    const target =
        toISODate(
            normaliseStudyDay(
                date
            )
        );

    let total = 0;


    buildStudyPlan().forEach(
        entry => {

            if (
                toISODate(
                    normaliseStudyDay(
                        entry.date
                    )
                ) === target
            ) {

                total +=
                    entry.durationSeconds;
            }

        }
    );


    return total;
}


function formatStudyLoad(
    seconds
) {

    const safe =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const hours =
        Math.floor(
            safe / 3600
        );

    const minutes =
        Math.round(
            (
                safe % 3600
            ) / 60
        );


    if (
        hours > 0
    ) {
        return `${hours}h ${minutes}m`;
    }


    return `${minutes}m`;
}


// =====================================================
// 13. SCHEDULED DATE/TIME
// =====================================================

function getScheduledDateTime(
    session
) {

    if (!semesterStarted) {
        return null;
    }


    const plannedDate =
        getPlannedSessionDate(
            session
        );


    const classDate =
        plannedDate ||
        getCourseDate(
            session.week ||
                currentWeek,
            session.day
        );


    if (!classDate) {
        return null;
    }


    const {
        hour,
        minute
    } =
        parseTime(
            session.time
        );


    const result =
        new Date(
            classDate
        );


    result.setHours(
        hour,
        minute,
        0,
        0
    );


    return result;
}


// =====================================================
// 14. CURRENT WEEK
// =====================================================

function calculateCurrentWeek() {

    if (
        !semesterStarted ||
        !semesterStartDate
    ) {
        return 1;
    }


    const start =
        parseDateOnly(
            semesterStartDate
        );


    const today =
        new Date();


    start.setHours(
        0,
        0,
        0,
        0
    );


    today.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        today.getTime() -
        start.getTime();


    if (
        difference < 0
    ) {
        return 1;
    }


    return (
        Math.floor(
            difference /
            (
                7 *
                24 *
                60 *
                60 *
                1000
            )
        ) + 1
    );
}


// =====================================================
// 15. START STUDY
// =====================================================

window.startSemester =
function () {

    if (semesterStarted) {
        return;
    }


    const today =
        new Date();


    const confirmed =
        window.confirm(
            "Start your semester today?\n\n" +
            `${formatDateLong(today)}\n\n` +
            "This date will become the beginning of Week 1."
        );


    if (!confirmed) {
        return;
    }


    semesterStarted =
        true;


    semesterStartDate =
        toISODate(
            today
        );


    localStorage.setItem(
        "semester_started",
        "true"
    );


    localStorage.setItem(
        "semester_start_date",
        semesterStartDate
    );


    currentWeek = "1";


    if (weekSelector) {
        weekSelector.value =
            "1";
    }


    renderSemesterStatus();

    renderApp();

    renderOverview();

    renderDailyWorkload();

    updateCurrentDateDisplay();
};


// =====================================================
// 16. RESET SEMESTER DATE ONLY
// =====================================================

window.resetSemester =
function () {

    const confirmed =
        window.confirm(
            "Reset semester start date?"
        );


    if (!confirmed) {
        return;
    }


    semesterStarted =
        false;

    semesterStartDate =
        null;

    currentWeek =
        "1";


    localStorage.removeItem(
        "semester_started"
    );

    localStorage.removeItem(
        "semester_start_date"
    );


    if (weekSelector) {
        weekSelector.value =
            "1";
    }


    renderSemesterStatus();

    renderApp();

    renderOverview();

    renderDailyWorkload();
};


// =====================================================
// 17. ATTENDANCE
// =====================================================

window.recordAttendance =
function (
    stateId
) {

    attendanceState[
        stateId
    ] = true;


    saveState();


    renderApp();
};


// =====================================================
// 18. SESSION STATE
// =====================================================

function sessionWatched(
    session
) {

    const videos =
        getSessionVideos(
            session
        );


    if (
        videos.length === 0
    ) {
        return false;
    }


    return videos.every(
        video =>
            watchedState[
                video.id
            ] === true
    );
}


function sessionDone(
    session
) {

    if (!session) {
        return false;
    }


    return (
        progressState[
            session.id
        ] === true
    );
}


// =====================================================
// 19. VIDEO WATCH
// =====================================================

window.recordVideoWatch =
function (
    sessionId,
    videoId
) {

    watchedState[
        videoId
    ] = true;


    saveState();


    renderApp();

    renderDailyWorkload();
};


// =====================================================
// 20. MARK COMPLETE
// =====================================================

window.toggleDone =
function (
    sessionId
) {

    const sessions =
        syllabusData[
            currentWeek
        ] || [];


    const session =
        sessions.find(
            item =>
                item.id ===
                sessionId
        );


    if (!session) {
        return;
    }


    const alreadyDone =
        sessionDone(
            session
        );


    // Undo
    if (alreadyDone) {

        delete progressState[
            sessionId
        ];


        delete completedSessions[
            sessionId
        ];


        saveState();


        renderApp();

        renderDailyWorkload();

        return;
    }


    const isAssessment =
        session.type ===
        "assessment";


    const isReview =
        session.type ===
        "review";


    // Normal lectures require all
    // videos to have been watched.
    if (
        !isAssessment &&
        !isReview
    ) {

        const videos =
            getSessionVideos(
                session
            );


        if (
            videos.length > 0 &&
            !sessionWatched(
                session
            )
        ) {

            return;
        }
    }


    progressState[
        sessionId
    ] = true;


    completedSessions[
        sessionId
    ] = true;


    saveState();


    renderApp();

    renderDailyWorkload();
};


// =====================================================
// 21. RESET EVERYTHING
//     RETURN TO START STUDY
// =====================================================

window.resetProgress =
function () {

    const confirmed =
        window.confirm(
            "Reset your semester?\n\n" +
            "This will erase:\n" +
            "• Watched lectures\n" +
            "• Completed sessions\n" +
            "• Attendance\n" +
            "• Semester start date\n" +
            "• Semester progress\n\n" +
            "Your syllabus, schedule, and lecture links will NOT be changed."
        );


    if (!confirmed) {
        return;
    }


    // Clear all progress
    localStorage.removeItem(
        "ppe_progress_state"
    );

    localStorage.removeItem(
        "ppe_watched_state"
    );

    localStorage.removeItem(
        "ppe_attendance_state"
    );

    localStorage.removeItem(
        "ppe_completed_sessions"
    );


    // Clear semester start
    localStorage.removeItem(
        "semester_started"
    );

    localStorage.removeItem(
        "semester_start_date"
    );


    // Reset memory
    progressState = {};

    watchedState = {};

    attendanceState = {};

    completedSessions = {};

    semesterStarted =
        false;

    semesterStartDate =
        null;

    currentWeek =
        "1";


    if (weekSelector) {
        weekSelector.value =
            "1";
    }


    // Re-render
    renderSemesterStatus();

    renderApp();

    renderOverview();

    renderDailyWorkload();

    updateCurrentDateDisplay();


    // Return to Tasks
    window.switchTab(
        "trackerTab"
    );


    window.scrollTo({
        top: 0,
        behavior: "auto"
    });


    window.alert(
        "Semester reset. Welcome back, Scholar."
    );
};


// =====================================================
// 22. WEEK DROPDOWN
// =====================================================

function populateDropdown() {

    if (!weekSelector) {
        return;
    }


    const weeks =
        Object.keys(
            syllabusData
        ).sort(
            (a, b) =>
                Number(a) -
                Number(b)
        );


    weekSelector.innerHTML =
        "";


    weeks.forEach(
        week => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                week;


            option.textContent =
                `Week ${week}`;


            weekSelector.appendChild(
                option
            );
        }
    );


    weekSelector.onchange =
        function (event) {

            currentWeek =
                event.target.value;


            if (
                statCurrentWeekEl
            ) {

                statCurrentWeekEl.textContent =
                    `W${currentWeek}`;
            }


            renderApp();

            renderOverview();

            renderDailyWorkload();
        };


    if (
        weeks.includes(
            String(
                currentWeek
            )
        )
    ) {

        weekSelector.value =
            String(
                currentWeek
            );
    }
}


// =====================================================
// 23. SEMESTER STATUS
// =====================================================

function renderSemesterStatus() {

    const statusEl =
        document.getElementById(
            "semesterStatus"
        );


    const startButton =
        document.getElementById(
            "startStudyBtn"
        );


    if (!semesterStarted) {

        if (statusEl) {

            statusEl.innerHTML = `
                <strong>
                    Semester not started
                </strong>

                <span
                    style="
                        display:block;
                        margin-top:4px;
                        color:var(--text-muted);
                    "
                >
                    Your curriculum is ready.
                    Start whenever you're ready.
                </span>
            `;
        }


        if (startButton) {

            startButton.disabled =
                false;

            startButton.textContent =
                "Start Study";
        }


        return;
    }


    const week =
        calculateCurrentWeek();


    if (statusEl) {

        statusEl.innerHTML = `
            <strong>
                Semester active
            </strong>

            <span
                style="
                    display:block;
                    margin-top:4px;
                    color:var(--text-muted);
                "
            >
                Started:
                ${formatDate(
                    parseDateOnly(
                        semesterStartDate
                    )
                )}

                · Week ${week}
            </span>
        `;
    }


    if (startButton) {

        startButton.disabled =
            true;

        startButton.textContent =
            "Semester Started";
    }
}


// =====================================================
// 24. TODAY'S STUDY LOAD
// =====================================================

function renderDailyWorkload() {

    const trackerTab =
        document.getElementById(
            "trackerTab"
        );


    if (!trackerTab) {
        return;
    }


    let card =
        document.getElementById(
            "dailyWorkloadCard"
        );


    if (!card) {

        card =
            document.createElement(
                "div"
            );


        card.id =
            "dailyWorkloadCard";


        card.className =
            "clean-card daily-workload-card";


        const hero =
            trackerTab.querySelector(
                ".hero-metric-card, .progress-card"
            );


        if (hero) {

            hero.insertAdjacentElement(
                "afterend",
                card
            );

        } else {

            trackerTab.prepend(
                card
            );
        }
    }


    if (!semesterStarted) {

        card.innerHTML = `
            <div class="card-head">
                <span class="badge badge-sub">
                    TODAY
                </span>

                <span
                    style="
                        color:var(--text-muted);
                        font-size:0.78rem;
                        font-weight:700;
                    "
                >
                    0m / 2h
                </span>
            </div>

            <h4>
                Today's Study Load
            </h4>

            <p
                style="
                    margin-top:8px;
                    color:var(--text-muted);
                    font-size:0.74rem;
                "
            >
                Start your semester whenever you're ready.
            </p>
        `;

        return;
    }


    const today =
        new Date();


    const loadSeconds =
        getDailyStudyLoad(
            today
        );


    const percent =
        Math.min(
            100,
            Math.round(
                (
                    loadSeconds /
                    DAILY_STUDY_LIMIT_SECONDS
                ) * 100
            )
        );


    card.innerHTML = `
        <div class="card-head">

            <span class="badge badge-sub">
                TODAY
            </span>

            <span
                style="
                    color:var(--primary-green);
                    font-size:0.78rem;
                    font-weight:700;
                "
            >
                ${formatStudyLoad(
                    loadSeconds
                )} / 2h
            </span>

        </div>


        <h4>
            Today's Study Load
        </h4>


        <div
            style="
                width:100%;
                height:7px;
                margin-top:10px;
                overflow:hidden;
                border-radius:999px;
                background:rgba(255,255,255,0.07);
            "
        >

            <div
                style="
                    width:${percent}%;
                    height:100%;
                    border-radius:999px;
                    background:var(--primary-green);
                    transition:width 0.3s ease;
                "
            ></div>

        </div>


        <p
            style="
                margin-top:9px;
                color:var(--text-muted);
                font-size:0.74rem;
                line-height:1.45;
            "
        >
            Maximum planned study time:
            2 hours per day.
            Whole sessions roll to the next
            study day when necessary.
        </p>
    `;
}


// =====================================================
// 25. RENDER TASKS
// =====================================================

function renderApp() {

    if (!courseListEl) {
        return;
    }


    courseListEl.innerHTML =
        "";


    // -----------------------------------------------
    // SEMESTER NOT STARTED
    // -----------------------------------------------

    if (!semesterStarted) {

        courseListEl.innerHTML = `

            <div
                class="clean-card"
                style="
                    text-align:center;
                    padding:32px 20px;
                "
            >

                <h4>
                    Semester Not Started
                </h4>


                <p
                    style="
                        color:var(--text-muted);
                        margin:10px 0 20px;
                        line-height:1.5;
                    "
                >
                    Your curriculum is ready.
                    Start whenever you're ready.
                </p>


                <button
                    class="task-btn"
                    onclick="startSemester()"
                >
                    Start Study
                </button>

            </div>

        `;


        if (progressFillEl) {
            progressFillEl.style.width =
                "0%";
        }


        if (completionRateBadge) {
            completionRateBadge.textContent =
                "0%";
        }


        if (statCompletedEl) {
            statCompletedEl.textContent =
                "0";
        }


        if (statRemainingEl) {
            statRemainingEl.textContent =
                "0";
        }


        if (statCurrentWeekEl) {
            statCurrentWeekEl.textContent =
                "W1";
        }


        renderDailyWorkload();

        return;
    }


    // -----------------------------------------------
    // CURRENT WEEK
    // -----------------------------------------------

    const currentWeekItems =
        syllabusData[
            currentWeek
        ] || [];


    const now =
        new Date();


    let completedCount =
        0;


    currentWeekItems.forEach(
        session => {

            const videos =
                getSessionVideos(
                    session
                );


            const isDone =
                sessionDone(
                    session
                );


            const isAssessment =
                session.type ===
                "assessment";


            const isReview =
                session.type ===
                "review";


            const allWatched =
                videos.length > 0
                    ? sessionWatched(
                        session
                    )
                    : false;


            const scheduledDateTime =
                getScheduledDateTime(
                    session
                );


            const isLocked =
                scheduledDateTime &&
                now <
                scheduledDateTime;


            if (isDone) {
                completedCount++;
            }


            // -----------------------------------------
            // STATUS
            // -----------------------------------------

            let badgeLabel =
                "Ready";


            let badgeClass =
                "";


            let buttonText =
                "Mark as Done";


            let buttonClass =
                "task-btn";


            let buttonDisabled =
                false;


            if (isDone) {

                badgeLabel =
                    "Completed";


                badgeClass =
                    "complete";


                buttonText =
                    "Completed (Undo)";


                buttonClass +=
                    " btn-undo";

            }

            else if (
                isLocked
            ) {

                badgeLabel =
                    "Upcoming";


                buttonText =
                    scheduledDateTime
                        ? `Available on ${formatDate(
                            scheduledDateTime
                        )}`
                        : "Available soon";


                buttonDisabled =
                    true;

            }

            else if (
                isReview
            ) {

                badgeLabel =
                    "Review Period";

            }

            else if (
                isAssessment
            ) {

                badgeLabel =
                    "Assessment";

            }

            else if (
                !allWatched
            ) {

                badgeLabel =
                    videos.length > 1
                        ? "Watch All Lectures"
                        : "Ready";


                buttonText =
                    videos.length > 1
                        ? "🔒 Watch All Videos to Unlock"
                        : "🔒 Watch Video to Unlock";


                buttonDisabled =
                    true;

            }

            else {

                badgeLabel =
                    "Ready to Complete";


                badgeClass =
                    "complete";
            }


            // -----------------------------------------
            // PROVIDER
            // -----------------------------------------

            const provider =
                courseCatalog[
                    session.code
                ]?.provider || "";


            // -----------------------------------------
            // LECTURE HTML
            // -----------------------------------------

            let lectureHtml =
                "";


            if (
                videos.length > 0
            ) {

                lectureHtml =
                    videos
                        .map(
                            (
                                video,
                                index
                            ) => {

                                const watched =
                                    watchedState[
                                        video.id
                                    ] === true;


                                const number =
                                    getLectureNumber(
                                        video
                                    );


                                const title =
                                    getDisplayLectureTitle(
                                        video
                                    );


                                const duration =
                                    formatDuration(
                                        video.durationSeconds
                                    );


                                return `

                                    <div
                                        style="
                                            margin-bottom:
                                                ${
                                                    index ===
                                                    videos.length - 1
                                                        ? "0"
                                                        : "8px"
                                                };
                                            line-height:
                                                1.45;
                                        "
                                    >

                                        <a
                                            href="${video.url}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onclick="
                                                recordVideoWatch(
                                                    '${session.id}',
                                                    '${video.id}'
                                                )
                                            "
                                        >

                                            ${
                                                number !== null
                                                    ? `Lecture ${number}`
                                                    : "Lecture"
                                            }

                                            —

                                            ${title}

                                            ↗

                                        </a>


                                        ${
                                            duration
                                                ? `
                                                    <span
                                                        style="
                                                            color:
                                                                var(--text-muted);
                                                            font-size:
                                                                0.78rem;
                                                            margin-left:
                                                                6px;
                                                        "
                                                    >
                                                        ${duration}
                                                    </span>
                                                `
                                                : ""
                                        }


                                        ${
                                            watched
                                                ? `
                                                    <span
                                                        style="
                                                            color:
                                                                var(--primary-green);
                                                            font-size:
                                                                0.78rem;
                                                            margin-left:
                                                                6px;
                                                        "
                                                    >
                                                        ✓ Watched
                                                    </span>
                                                `
                                                : ""
                                        }

                                    </div>

                                `;
                            }
                        )
                        .join("");

            }

            else {

                lectureHtml = `
                    <span>
                        ${
                            session.details ||
                            session.material ||
                            "No lecture videos assigned."
                        }
                    </span>
                `;
            }


            // -----------------------------------------
            // PLANNED DATE
            // -----------------------------------------

            const actualClassDate =
                getPlannedSessionDate(
                    session
                ) ||
                getCourseDate(
                    session.week ||
                        currentWeek,
                    session.day
                );


            // -----------------------------------------
            // WORKLOAD
            // -----------------------------------------

            const plannedSeconds =
                getPlannedSessionDuration(
                    session
                );


            const workload =
                plannedSeconds > 0
                    ? formatDuration(
                        plannedSeconds
                    )
                    : "";


            // -----------------------------------------
            // CARD
            // -----------------------------------------

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                `clean-card ${
                    isDone
                        ? "done-task"
                        : ""
                }`;


            card.innerHTML = `

                <div
                    class="
                        card-head
                    "
                >

                    <span
                        class="
                            badge
                            badge-sub
                        "
                    >
                        ${session.code}
                    </span>


                    <span
                        class="
                            badge
                            badge-status
                            ${badgeClass}
                        "
                    >
                        ${badgeLabel}
                    </span>

                </div>


                <h4>
                    ${session.name}
                </h4>


                ${
                    provider
                        ? `
                            <div
                                style="
                                    font-size:0.78rem;
                                    color:var(--text-muted);
                                    margin-top:-2px;
                                    margin-bottom:10px;
                                "
                            >
                                ${provider}
                            </div>
                        `
                        : ""
                }


                <div
                    class="
                        task-meta-line
                    "
                >

                    <span
                        class="label"
                    >
                        Date
                    </span>


                    <span>

                        ${
                            actualClassDate

                                ? `${actualClassDate.toLocaleDateString(
                                    "en-GB",
                                    {
                                        weekday:
                                            "long"
                                    }
                                )}, ${formatDate(
                                    actualClassDate
                                )}`

                                : session.day
                        }

                        ·

                        ${session.time}

                    </span>

                </div>


                <div
                    class="
                        task-meta-line
                    "
                >

                    <span
                        class="label"
                    >
                        Lecture
                    </span>


                    <div
                        style="
                            flex:1;
                            min-width:0;
                        "
                    >
                        ${lectureHtml}
                    </div>

                </div>


                ${
                    workload
                        ? `
                            <div
                                class="
                                    task-meta-line
                                "
                            >

                                <span
                                    class="label"
                                >
                                    Workload
                                </span>


                                <span>
                                    ${workload}
                                </span>

                            </div>
                        `
                        : ""
                }


                <div
                    class="
                        task-meta-line
                    "
                >

                    <span
                        class="label"
                    >
                        Reading
                    </span>


                    <span>
                        ${
                            session.book ||
                            "—"
                        }
                    </span>

                </div>


                <button
                    class="${buttonClass}"
                    data-stateid="${session.id}"
                    ${
                        buttonDisabled
                            ? "disabled"
                            : ""
                    }
                >
                    ${buttonText}
                </button>

            `;


            const button =
                card.querySelector(
                    "button"
                );


            if (
                button &&
                !buttonDisabled
            ) {

                button.addEventListener(
                    "click",
                    () =>
                        toggleDone(
                            session.id
                        )
                );
            }


            courseListEl.appendChild(
                card
            );

        }
    );


    // -----------------------------------------------
    // PROGRESS
    // -----------------------------------------------

    const total =
        currentWeekItems.length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (
                    completedCount /
                    total
                ) * 100
            );


    if (progressFillEl) {

        progressFillEl.style.width =
            `${percentage}%`;
    }


    if (
        completionRateBadge
    ) {

        completionRateBadge.textContent =
            `${percentage}%`;
    }


    if (
        statCompletedEl
    ) {

        statCompletedEl.textContent =
            completedCount;
    }


    if (
        statRemainingEl
    ) {

        statRemainingEl.textContent =
            total -
            completedCount;
    }


    if (
        statCurrentWeekEl
    ) {

        statCurrentWeekEl.textContent =
            `W${currentWeek}`;
    }


    renderDailyWorkload();
}


// =====================================================
// 26. SYLLABUS OVERVIEW
// =====================================================

function renderOverview() {

    const overviewEl =
        document.getElementById(
            "overviewContent"
        );


    if (!overviewEl) {
        return;
    }


    overviewEl.innerHTML =
        "";


    Object.keys(
        syllabusData
    )
    .sort(
        (
            a,
            b
        ) =>
            Number(a) -
            Number(b)
    )
    .forEach(
        week => {

            const weekData =
                syllabusData[
                    week
                ] || [];


            // Group sessions by course.
            const groupedCourses =
                {};


            weekData.forEach(
                session => {

                    if (
                        !groupedCourses[
                            session.code
                        ]
                    ) {

                        groupedCourses[
                            session.code
                        ] = [];
                    }


                    groupedCourses[
                        session.code
                    ].push(
                        session
                    );
                }
            );


            let html = `

                <div
                    class="
                        overview-week-group
                    "
                >
                <div
                    class="week-toggle"
                    onclick="toggleAccordion(this)"
                >

                        <span>
                            Week ${week}
                            Curriculum
                        </span>


                        <span>
                            +
                        </span>

                    </div>


                   <div id="week-content-${week}" class="week-content">

                        <div
                            style="
                                display:flex;
                                flex-direction:column;
                                gap:24px;
                            "
                        >
            `;


            Object.keys(
                groupedCourses
            ).forEach(
                code => {

                    const sessions =
                        groupedCourses[
                            code
                        ];


                    const firstSession =
                        sessions[0];


                    html += `

                        <div
                            style="
                                padding-bottom:20px;
                                border-bottom:
                                    1px solid
                                    var(--border-color);
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:8px;
                                    margin-bottom:8px;
                                "
                            >

                                <span
                                    class="
                                        badge
                                        badge-sub
                                    "
                                >
                                    ${code}
                                </span>

                            </div>


                            <strong
                                style="
                                    display:block;
                                    color:
                                        var(--text-primary);
                                    font-size:1rem;
                                    margin-bottom:12px;
                                "
                            >
                                ${firstSession.name}
                            </strong>
                    `;


                    sessions.forEach(
                        session => {

                            const videos =
                                getSessionVideos(
                                    session
                                );


                            if (
                                videos.length > 0
                            ) {

                                videos.forEach(
                                    video => {

                                        const number =
                                            getLectureNumber(
                                                video
                                            );


                                        const title =
                                            getDisplayLectureTitle(
                                                video
                                            );


                                        html += `

                                            <div
                                                style="
                                                    padding-left:12px;
                                                    margin-bottom:8px;
                                                    line-height:1.5;
                                                "
                                            >

                                                <span
                                                    style="
                                                        color:
                                                            var(--primary-green);
                                                        font-weight:600;
                                                    "
                                                >

                                                    ${
                                                        number !== null
                                                            ? `Lecture ${number}`
                                                            : "Lecture"
                                                    }

                                                </span>


                                                <span
                                                    style="
                                                        color:
                                                            var(--text-secondary);
                                                    "
                                                >

                                                    —

                                                    ${title}

                                                </span>

                                            </div>

                                        `;
                                    }
                                );

                            }

                            else {

                                html += `

                                    <div
                                        style="
                                            padding-left:12px;
                                            margin-bottom:8px;
                                        "
                                    >

                                        <span
                                            style="
                                                color:
                                                    var(--primary-green);
                                                font-weight:600;
                                            "
                                        >
                                            ${
                                                session.material ||
                                                "Academic Session"
                                            }
                                        </span>


                                        ${
                                            session.details
                                                ? `
                                                    <span
                                                        style="
                                                            display:block;
                                                            color:
                                                                var(--text-secondary);
                                                            margin-top:3px;
                                                        "
                                                    >
                                                        ${session.details}
                                                    </span>
                                                `
                                                : ""
                                        }

                                    </div>

                                `;
                            }


                            if (
                                session.book
                            ) {

                                html += `

                                    <div
                                        style="
                                            padding-left:12px;
                                            margin-top:10px;
                                            color:
                                                var(--text-muted);
                                            font-size:0.8rem;
                                        "
                                    >
                                        Reading:
                                        ${session.book}
                                    </div>

                                `;
                            }

                        }
                    );


                    html += `
                        </div>
                    `;
                }
            );


            html += `

                        </div>

                    </div>

                </div>

            `;


            overviewEl.innerHTML +=
                html;
        }
    );
}


/// =====================================================
// 27. ACCORDION
// =====================================================

window.toggleAccordion = function (element) {
    const content = element.nextElementSibling;

    if (!content) {
        console.error("Accordion content not found");
        return;
    }

    content.classList.toggle("expanded");
    element.classList.toggle("open");
};

// =====================================================
// 28. PLAYLIST DIRECTORY
// =====================================================

function renderPlaylists() {

    const playlistList =
        document.getElementById(
            "playlistList"
        );


    if (!playlistList) {
        return;
    }


    const playlists = [

        {
            code: "PHIL101",

            name:
                "Introduction to Logic",

            provider:
                "Zachary Fruhling",

            url:
                "https://www.youtube.com/playlist?list=PL2uWqdcaf189i8r_Rh-1dFLmRjKN3EwDI"
        },


        {
            code: "POLS101",

            name:
                "Introduction to Philosophical Politics",

            provider:
                "Yale Courses",

            url:
                "https://www.youtube.com/playlist?list=PL8D95DEA9B7DFE825"
        },


        {
            code: "ECON101",

            name:
                "Principles of Microeconomics",

            provider:
                "MIT OpenCourseWare",

            url:
                "https://www.youtube.com/playlist?list=PLUl4u3cNGP60V7HxLYRaJMbFzP77bzEjb"
        },


        {
            code: "PHIL102",

            name:
                "General Philosophy",

            provider:
                "Philosophy",

            url:
                "https://www.youtube.com/playlist?list=PLg4lEYaHO--SDCgjDUP1nQbn3_Fztv4LK"
        },


        {
            code: "POLS102",

            name:
                "Power and Politics in Today's World",

            provider:
                "Yale Courses",

            url:
                "https://www.youtube.com/playlist?list=PLh9mgdi4rNeyViG2ar68jkgEi4y6doNZy"
        },


        {
            code: "MATH101",

            name:
                "Mathematics for Economics",

            provider:
                "Lazarski Open Courses",

            url:
                "https://www.youtube.com/playlist?list=PL9aqlRevPSRDsivOFyJ9b3v1ujCwBLkHs"
        }

    ];


    playlistList.innerHTML =
        "";


    playlists.forEach(
        course => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "clean-card hub-card";


            card.innerHTML = `

                <div
                    class="
                        card-head
                    "
                >

                    <span
                        class="
                            badge
                            badge-sub
                        "
                    >
                        ${course.code}
                    </span>


                    <span
                        class="
                            prof-tag
                        "
                    >
                        ${course.provider}
                    </span>

                </div>


                <h4>
                    ${course.name}
                </h4>


                <a
                    href="${course.url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="
                        youtube-link
                    "
                >

                    <span
                        class="
                            youtube-icon
                        "
                    >
                        ▶
                    </span>


                    <span>
                        Watch Playlist
                    </span>


                    <span
                        class="
                            external-icon
                        "
                    >
                        ↗
                    </span>

                </a>

            `;


            playlistList.appendChild(
                card
            );
        }
    );
}


// =====================================================
// 29. LOAD SYLLABUS
// =====================================================

async function loadSyllabus() {

    try {

        const response =
            await fetch(
                "./data/syllabus.json",
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        syllabusData =
            data.weeks ||
            {};


        courseCatalog =
            data.courses ||
            {};


        appSettings =
            data.settings ||
            {};


        // Update current week when
        // the semester is active.
        if (
            semesterStarted
        ) {

            const calculatedWeek =
                calculateCurrentWeek();


            const availableWeeks =
                Object.keys(
                    syllabusData
                );


            if (
                availableWeeks.includes(
                    String(
                        calculatedWeek
                    )
                )
            ) {

                currentWeek =
                    String(
                        calculatedWeek
                    );
            }
        }


        populateDropdown();


        renderSemesterStatus();


        renderApp();


        renderOverview();


        renderPlaylists();


        updateCurrentDateDisplay();


        renderDailyWorkload();

    }

    catch (error) {

        console.error(
            "Failed to load syllabus:",
            error
        );


        if (
            courseListEl
        ) {

            courseListEl.innerHTML = `

                <p
                    style="
                        color:red;
                        text-align:center;
                    "
                >

                    Unable to load
                    data/syllabus.json.

                    <br><br>

                    ${error.message}

                </p>

            `;
        }
    }
}


// =====================================================
// 30. LIVE DATE + WEEK UPDATE
// =====================================================

setInterval(
    () => {

        updateCurrentDateDisplay();


        if (
            !semesterStarted
        ) {

            renderDailyWorkload();

            return;
        }


        const calculatedWeek =
            calculateCurrentWeek();


        const weekExists =
            syllabusData[
                String(
                    calculatedWeek
                )
            ];


        if (
            weekExists &&
            currentWeek !==
                String(
                    calculatedWeek
                )
        ) {

            currentWeek =
                String(
                    calculatedWeek
                );


            if (
                weekSelector
            ) {

                weekSelector.value =
                    currentWeek;
            }
        }


        renderSemesterStatus();


        renderApp();


        renderOverview();


        renderDailyWorkload();

    },
    60 * 1000
);


// =====================================================
// 31. START APPLICATION
// =====================================================

updateCurrentDateDisplay();

loadSyllabus();
