// ========================================
// PERSISTENT USER PROGRESS
// ========================================

const STORAGE_KEY = "ppe_completed_sessions";

// Load saved progress
function loadSavedProgress() {
try {
return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
} catch (error) {
console.error("Could not load saved progress:", error);
return {};
}
}

// Save progress
function saveProgress(progress) {
try {
localStorage.setItem(
STORAGE_KEY,
JSON.stringify(progress)
);
} catch (error) {
console.error("Could not save progress:", error);
}
}

// Current completed sessions
let completedSessions = loadSavedProgress();

// =====================================================
// PERSONAL UNIVERSITY PORTAL
// app.js
// =====================================================

let currentWeek = "1";
let syllabusData = {};
let courseCatalog = {};
let appSettings = {};

// Maximum planned study time per study day: 2 hours.
const DAILY_STUDY_LIMIT_SECONDS = 2 * 60 * 60;

// =====================================================
// SEMESTER STATE
// =====================================================

let semesterStarted =
localStorage.getItem("semester_started") === "true";

let semesterStartDate =
localStorage.getItem("semester_start_date") || null;

// =====================================================
// PROGRESS STATE
// =====================================================

let progressState =
JSON.parse(
localStorage.getItem("ppe_progress_state")
) || {};

let watchedState =
JSON.parse(
localStorage.getItem("ppe_watched_state")
) || {};

// =====================================================
// DOM
// =====================================================

const courseListEl =
document.getElementById("courseList");

const progressFillEl =
document.getElementById("progressFill");

const weekSelector =
document.getElementById("weekSelector");

const completionRateBadge =
document.getElementById("completionRateBadge");

const statCompletedEl =
document.getElementById("statCompleted");

const statRemainingEl =
document.getElementById("statRemaining");

const statCurrentWeekEl =
document.getElementById("statCurrentWeek");

// =====================================================
// STORAGE
// =====================================================

function saveState() {
localStorage.setItem(
"ppe_progress_state",
JSON.stringify(progressState)
);

localStorage.setItem(
    "ppe_watched_state",
    JSON.stringify(watchedState)
);

}

// =====================================================
// TAB CONTROLLER
// =====================================================

window.switchTab = function (tabId) {

document
    .querySelectorAll(".tab-content")
    .forEach(el => {
        el.classList.remove("active");
    });

document
    .querySelectorAll(".nav-item")
    .forEach(el => {
        el.classList.remove("active");
    });

const target =
    document.getElementById(tabId);

if (target) {
    target.classList.add("active");
}

const indexMap = {
    trackerTab: 0,
    playlistTab: 1,
    overviewTab: 2,
    profileTab: 3
};

const navItems =
    document.querySelectorAll(".nav-item");

const index =
    indexMap[tabId];

if (
    index !== undefined &&
    navItems[index]
) {
    navItems[index].classList.add("active");
}

window.scrollTo({
    top: 0,
    behavior: "smooth"
});

};

// =====================================================
// DATE HELPERS
// =====================================================

function parseDateOnly(dateString) {

if (!dateString) {
    return new Date("Invalid");
}

const parts =
    String(dateString)
        .split("-")
        .map(Number);

if (parts.length !== 3) {
    return new Date("Invalid");
}

const [year, month, day] = parts;

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
    String(date.getMonth() + 1)
        .padStart(2, "0");

const day =
    String(date.getDate())
        .padStart(2, "0");

return `${year}-${month}-${day}`;

}

function formatDate(date) {

if (
    !date ||
    Number.isNaN(date.getTime())
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
    Number.isNaN(date.getTime())
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
// LIVE HEADER DATE
// =====================================================

function updateCurrentDateDisplay() {

    const dateElement =
        document.getElementById(
            "currentDateDisplay"
        );

    if (!dateElement) {
        return;
    }

    const today =
        new Date();

    dateElement.textContent =
        today.toLocaleDateString(
            "en-GB",
            {
                weekday: "long",
                day: "2-digit",
                month: "long"
            }
        );
}

function parseTime(timeString) {

const parts =
    String(timeString || "00:00")
        .split(":")
        .map(Number);

return {
    hour: Number.isFinite(parts[0])
        ? parts[0]
        : 0,

    minute: Number.isFinite(parts[1])
        ? parts[1]
        : 0
};

}

// =====================================================
// WEEK / DAY HELPERS
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

function getDayNumber(dayName) {
return DAY_MAP[
String(dayName || "").trim()
];
}

// =====================================================
// SEMESTER CALENDAR
// =====================================================

function getWeekStartDate(weekNumber) {

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

const weekStart =
    new Date(start);

weekStart.setDate(
    start.getDate() +
    (
        (Number(weekNumber) - 1) * 7
    )
);

return weekStart;

}
function getCourseDate(weekNumber, dayName) {

    if (!semesterStartDate) {
        return null;
    }

    const startDate =
        parseDateOnly(semesterStartDate);

    if (
        !startDate ||
        Number.isNaN(startDate.getTime())
    ) {
        return null;
    }

    /*
     * Week 1 is anchored to the exact
     * Start Study date.
     *
     * Monday = study day 0
     * Tuesday = study day 1
     * Wednesday = study day 2
     * Thursday = study day 3
     * Friday = study day 4
     *
     * Saturday/Sunday are holidays.
     */

    const originalDay =
        getDayNumber(dayName);

    if (originalDay === undefined) {
        return null;
    }

    // Saturday and Sunday are holidays.
    if (
        originalDay === 0 ||
        originalDay === 6
    ) {
        return null;
    }

    // Convert original syllabus weekday
    // into a Monday-Friday study-day index.
    const dayIndex =
        originalDay - 1;

    /*
     * Each academic week contains
     * five study days.
     */
    const totalStudyDayIndex =
        (Number(weekNumber) - 1) * 5 +
        dayIndex;

    /*
     * Move forward from the selected
     * Start Study date while skipping
     * Saturday and Sunday.
     */
    const result =
        new Date(startDate);

    let remainingDays =
        totalStudyDayIndex;

    while (remainingDays > 0) {

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

    /*
     * If Start Study itself is Saturday
     * or Sunday, move to Monday.
     */
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
// 2-HOUR DAILY STUDY PLANNER
// =====================================================

function getPlannedSessionDuration(session) {

    if (!session) {
        return 0;
    }

    // Use the explicit workload when provided.
    if (
        session.sessionDurationSeconds !== undefined &&
        session.sessionDurationSeconds !== null &&
        Number(session.sessionDurationSeconds) > 0
    ) {
        return Number(session.sessionDurationSeconds);
    }

    // Otherwise use the total duration of the session's videos.
    return getSessionVideos(session).reduce(
        (total, video) =>
            total +
            (
                Number(video.durationSeconds) > 0
                    ? Number(video.durationSeconds)
                    : 0
            ),
        0
    );
}

function nextStudyDay(date) {

    const result = new Date(date);

    do {
        result.setDate(result.getDate() + 1);
    } while (
        result.getDay() === 0 ||
        result.getDay() === 6
    );

    result.setHours(0, 0, 0, 0);

    return result;
}

function normaliseStudyDay(date) {

    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    while (
        result.getDay() === 0 ||
        result.getDay() === 6
    ) {
        result.setDate(result.getDate() + 1);
    }

    return result;
}

/*
 * Builds one semester-wide plan.
 *
 * Rules:
 * 1. Keep the syllabus order.
 * 2. Never schedule a session before its syllabus anchor date.
 * 3. Keep each session whole; never split a lecture.
 * 4. Do not put more than 2 hours of normal work on a day.
 * 5. If adding a session would exceed 2 hours, move the entire
 *    session to the next weekday.
 * 6. A single session longer than 2 hours stays whole on its
 *    own study day, because lectures are never split.
 */
function buildStudyPlan() {

    const plan = new Map();

    if (
        !semesterStarted ||
        !semesterStartDate
    ) {
        return plan;
    }

    const sessions = [];

    Object.keys(syllabusData)
        .sort(
            (a, b) =>
                Number(a) - Number(b)
        )
        .forEach(
            week => {

                const weekItems =
                    syllabusData[week] || [];

                weekItems.forEach(
                    (
                        session,
                        index
                    ) => {

                        const anchorDate =
                            getCourseDate(
                                session.week || week,
                                session.day
                            );

                        if (!anchorDate) {
                            return;
                        }

                        sessions.push({
                            session,
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
        (a, b) => {

            const dateDifference =
                a.anchorDate.getTime() -
                b.anchorDate.getTime();

            if (dateDifference !== 0) {
                return dateDifference;
            }

            return a.index - b.index;
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
             * A session can never move backwards
             * relative to an earlier scheduled session.
             */
            if (
                currentDate &&
                plannedDate.getTime() <
                    currentDate.getTime()
            ) {
                plannedDate =
                    new Date(currentDate);
            }

            plannedDate =
                normaliseStudyDay(
                    plannedDate
                );

            /*
             * If this session would exceed the
             * 2-hour daily budget, roll the entire
             * session to the next weekday.
             *
             * Long single sessions (>2h) are kept whole.
             */
            if (
                usedSeconds > 0 &&
                duration > 0 &&
                usedSeconds + duration >
                    DAILY_STUDY_LIMIT_SECONDS
            ) {

                plannedDate =
                    nextStudyDay(
                        plannedDate
                    );

                usedSeconds = 0;
            }

            /*
             * If the date changed because the syllabus
             * moved us forward, this is a fresh day.
             */
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

            usedSeconds += duration;

            currentDate =
                new Date(
                    plannedDate
                );
        }
    );

    return plan;
}

function getPlannedSessionDate(session) {

    const plan =
        buildStudyPlan();

    const entry =
        plan.get(
            session.id
        );

    return entry
        ? entry.date
        : null;
}

function getDailyStudyLoad(date) {

    if (!date) {
        return 0;
    }

    const target =
        toISODate(
            normaliseStudyDay(
                date
            )
        );

    const plan =
        buildStudyPlan();

    let total = 0;

    plan.forEach(
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

function formatStudyLoad(seconds) {

    const safeSeconds =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const hours =
        Math.floor(
            safeSeconds / 3600
        );

    const minutes =
        Math.round(
            (safeSeconds % 3600) / 60
        );

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

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
            trackerTab.prepend(card);
        }
    }

    const today =
        new Date();

    const loadSeconds =
        getDailyStudyLoad(
            today
        );

    const loadLabel =
        formatStudyLoad(
            loadSeconds
        );

    const limitLabel =
        formatStudyLoad(
            DAILY_STUDY_LIMIT_SECONDS
        );

    const percent =
        DAILY_STUDY_LIMIT_SECONDS > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        loadSeconds /
                        DAILY_STUDY_LIMIT_SECONDS
                    ) * 100
                )
            )
            : 0;

    card.innerHTML = `
        <div class="card-head">
            <span class="badge badge-sub">
                TODAY
            </span>

            <span
                style="
                    color:var(--primary-green);
                    font-weight:700;
                    font-size:0.78rem;
                "
            >
                ${loadLabel} / ${limitLabel}
            </span>
        </div>

        <h4>
            Today's Study Load
        </h4>

        <div
            style="
                width:100%;
                height:7px;
                background:rgba(255,255,255,0.07);
                border-radius:999px;
                overflow:hidden;
                margin-top:10px;
            "
        >
            <div
                style="
                    width:${percent}%;
                    height:100%;
                    background:var(--primary-green);
                    border-radius:999px;
                    transition:width 0.3s ease;
                "
            ></div>
        </div>

        <p
            style="
                margin-top:9px;
                color:var(--text-muted);
                font-size:0.74rem;
            "
        >
            Sessions are kept whole. Anything that would push
            the day beyond two hours rolls to the next study day.
        </p>
    `;
}

function getScheduledDateTime(session) {

if (!semesterStarted) {
    return null;
}

const weekNumber =
    session.week || currentWeek;

const classDate =
    getCourseDate(
        weekNumber,
        session.day
    );

if (!classDate) {
    return null;
}

const {
    hour,
    minute
} = parseTime(session.time);

classDate.setHours(
    hour,
    minute,
    0,
    0
);

return classDate;

}

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

if (difference < 0) {
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
// START SEMESTER
// =====================================================

window.startSemester = function () {

if (semesterStarted) {
    return;
}

const today =
    new Date();

const confirmed =
    window.confirm(
        `Start your semester today?\n\n` +
        `${formatDateLong(today)}\n\n` +
        `This date will become the beginning of Week 1.`
    );

if (!confirmed) {
    return;
}

semesterStarted = true;

semesterStartDate =
    toISODate(today);

localStorage.setItem(
    "semester_started",
    "true"
);

localStorage.setItem(
    "semester_start_date",
    semesterStartDate
);

currentWeek =
    String(
        calculateCurrentWeek()
    );

if (weekSelector) {
    weekSelector.value =
        currentWeek;
}

renderSemesterStatus();
renderApp();
renderOverview();

};

// =====================================================
// RESET SEMESTER
// =====================================================

window.resetSemester = function () {

const confirmed =
    window.confirm(
        "Reset semester start date?"
    );

if (!confirmed) {
    return;
}

semesterStarted = false;
semesterStartDate = null;
currentWeek = "1";

localStorage.removeItem(
    "semester_started"
);

localStorage.removeItem(
    "semester_start_date"
);

if (weekSelector) {
    weekSelector.value = "1";
}

renderSemesterStatus();
renderApp();
renderOverview();

};

// =====================================================
// VIDEO HELPERS
// =====================================================

function formatDuration(seconds) {

if (
    seconds === undefined ||
    seconds === null ||
    Number.isNaN(Number(seconds))
) {
    return "";
}

const total =
    Math.round(Number(seconds));

const hours =
    Math.floor(total / 3600);

const minutes =
    Math.floor(
        (total % 3600) / 60
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
    courseCatalog[courseCode];

if (
    !course ||
    !Array.isArray(course.videos)
) {
    return null;
}

return course.videos.find(
    video =>
        video.id === videoId
) || null;

}

function getLectureNumber(video) {

if (!video) {
    return null;
}

if (
    video.lectureNumber !== undefined &&
    video.lectureNumber !== null
) {
    return video.lectureNumber;
}

if (
    video.number !== undefined &&
    video.number !== null
) {
    return video.number;
}

return null;

}

// Clean double numbering only in UI.
function getDisplayLectureTitle(video) {

if (!video) {
    return "";
}

let title =
    String(
        video.displayTitle ||
        video.title ||
        ""
    ).trim();

// "01. Title" -> "Title"
title =
    title.replace(
        /^\s*\d+\s*\.\s*/,
        ""
    );

// "Lecture 1: Title" -> "Title"
title =
    title.replace(
        /^\s*Lecture\s*#?\s*\d+\s*[:.\-]\s*/i,
        ""
    );

// "1: Title" -> "Title"
title =
    title.replace(
        /^\s*\d+\s*[:\-]\s+/,
        ""
    );

return title.trim();

}

function getSessionVideos(session) {

if (
    !session ||
    !Array.isArray(session.lectureIds)
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
// SESSION STATE
// =====================================================

function sessionWatched(session) {

const videos =
    getSessionVideos(session);

if (videos.length === 0) {
    return false;
}

return videos.every(
    video =>
        watchedState[video.id] === true
);

}

function sessionDone(session) {

if (!session) {
    return false;
}

return (
    progressState[session.id] === true
);

}

// =====================================================
// VIDEO WATCH
// =====================================================

window.recordVideoWatch =
function (
sessionId,
videoId
) {

    watchedState[videoId] = true;

    saveState();

    renderApp();
};

// =====================================================
// COMPLETION
// =====================================================

window.toggleDone =
function (sessionId) {

    const sessions =
        syllabusData[currentWeek] || [];

    const session =
        sessions.find(
            item =>
                item.id === sessionId
        );

    if (!session) {
        return;
    }

    const alreadyDone =
        sessionDone(session);

    // Undo
    if (alreadyDone) {

        delete progressState[
            sessionId
        ];

        saveState();

        renderApp();

        return;
    }

    const isAssessment =
        session.type === "assessment";

    const isReview =
        session.type === "review";

    // Normal lectures require every video
    // to have been watched.
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
            !sessionWatched(session)
        ) {
            return;
        }
    }

    progressState[
        sessionId
    ] = true;

    saveState();

    renderApp();
};

// =====================================================
// RESET EVERYTHING — RETURN TO START STUDY
// =====================================================

window.resetProgress = function () {

    const confirmed = window.confirm(
        "Reset your semester?\n\n" +
        "This will erase:\n" +
        "• Watched lectures\n" +
        "• Completed sessions\n" +
        "• Attendance\n" +
        "• Semester start status\n\n" +
        "Your syllabus, schedule, and lecture links will NOT be changed."
    );

    if (!confirmed) {
        return;
    }

    // -----------------------------------------
    // 1. CLEAR ALL PROGRESS
    // -----------------------------------------

    localStorage.removeItem("ppe_progress_state");
    localStorage.removeItem("ppe_watched_state");
    localStorage.removeItem("ppe_completed_sessions");
    localStorage.removeItem("ppe_attendance_state");

    // -----------------------------------------
    // 2. CLEAR SEMESTER START
    // -----------------------------------------

    localStorage.removeItem("semester_started");
    localStorage.removeItem("semester_start_date");

    // -----------------------------------------
    // 3. RESET MEMORY STATE
    // -----------------------------------------

    progressState = {};
    watchedState = {};
    completedSessions = {};

    semesterStarted = false;
    semesterStartDate = null;

    // -----------------------------------------
    // 4. RETURN TO WEEK 1
    // -----------------------------------------

    currentWeek = "1";

    // -----------------------------------------
    // 5. SHOW START STUDY SCREEN
    // -----------------------------------------

    if (typeof renderSemesterStatus === "function") {
        renderSemesterStatus();
    }

    renderApp();
    renderOverview();

    // -----------------------------------------
    // 6. GO TO MAIN STUDY TAB
    // -----------------------------------------

    window.switchTab("trackerTab");

    // -----------------------------------------
    // 7. SCROLL TO TOP
    // -----------------------------------------

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });

    // -----------------------------------------
    // 8. CONFIRM
    // -----------------------------------------

    alert("Semester reset. Welcome back, Scholar.");

};

// =====================================================
// LOAD SYLLABUS
// =====================================================

async function loadSyllabus() {

    try {

        const response =
            await fetch("./data/syllabus.json", {
                cache: "no-store"
            });

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        syllabusData =
            data.weeks || {};

        courseCatalog =
            data.courses || {};

        appSettings =
            data.settings || {};


        // Build the rest of the app
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

        if (courseListEl) {

            courseListEl.innerHTML = `
                <p style="
                    color:red;
                    text-align:center;
                ">
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
// START
// =====================================================

loadSyllabus();
