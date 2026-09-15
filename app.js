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
function updateCurrentDateDisplay() {
    const el = document.getElementById("currentDateDisplay");

    if (!el) return;

    const today = new Date();

    el.textContent = today.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
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

function updateCurrentDateDisplay() {
    const dateEl = document.getElementById("currentDateDisplay");

    if (!dateEl) {
        return;
    }

    const today = new Date();

    dateEl.textContent = today.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long"
    });
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

function getCourseDate(
weekNumber,
dayName
) {

const weekStart =
    getWeekStartDate(
        weekNumber
    );

if (!weekStart) {
    return null;
}

const targetDay =
    getDayNumber(dayName);

if (targetDay === undefined) {
    return null;
}

const currentDay =
    weekStart.getDay();

let difference =
    targetDay - currentDay;

if (difference < 0) {
    difference += 7;
}

const result =
    new Date(weekStart);

result.setDate(
    weekStart.getDate() +
    difference
);

return result;

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
        await fetch(
            "./data/syllabus.json",
            {
                cache: "no-store"
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
        data.weeks || {};

    courseCatalog =
        data.courses || {};

    appSettings =
        data.settings || {};

    if (semesterStarted) {

        const calculatedWeek =
            calculateCurrentWeek();

        const availableWeeks =
            Object.keys(
                syllabusData
            );

        if (
            availableWeeks.includes(
                String(calculatedWeek)
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


} catch (error) {

    console.error(
        "Failed to load syllabus:",
        error
    );

    if (courseListEl) {

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
// WEEK DROPDOWN
// =====================================================

function populateDropdown() {

if (!weekSelector) {
    return;
}

const weeks =
    Object.keys(
        syllabusData
    );

weekSelector.innerHTML = "";

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

        if (statCurrentWeekEl) {

            statCurrentWeekEl.textContent =
                `W${currentWeek}`;
        }

        renderApp();
        renderOverview();
    };

if (
    weeks.includes(
        currentWeek
    )
) {

    weekSelector.value =
        currentWeek;
}

}

// =====================================================
// SEMESTER STATUS
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
                Start whenever you're ready.
            </span>
        `;
    }

    if (startButton) {

        startButton.disabled = false;

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

    startButton.disabled = true;

    startButton.textContent =
        "Semester Started";
}

}

// =====================================================
// RENDER TASKS
// =====================================================

function renderApp() {

if (!courseListEl) {
    return;
}

courseListEl.innerHTML = "";

// -----------------------------------------------
// BEFORE SEMESTER START
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

let completedCount = 0;

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

        else if (isLocked) {

    badgeLabel = "Upcoming";

    buttonText =
        scheduledDateTime
            ? `Available on ${formatDate(scheduledDateTime)}`
            : "Available soon";

    buttonDisabled = true;
        }

        else if (isReview) {

            badgeLabel =
                "Review Period";

        }

        else if (isAssessment) {

            badgeLabel =
                "Assessment";
        }

        else if (!allWatched) {

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

        if (videos.length > 0) {

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

        } else {

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
        // DATE
        // -----------------------------------------

        const actualClassDate =
            getCourseDate(
                session.week ||
                    currentWeek,
                session.day
            );

        // -----------------------------------------
        // WORKLOAD
        // -----------------------------------------

        const workload =
            session.sessionDurationSeconds
                ? formatDuration(
                    session.sessionDurationSeconds
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

            <div class="card-head">

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
                                font-size:
                                    0.78rem;
                                color:
                                    var(--text-muted);
                                margin-top:
                                    -2px;
                                margin-bottom:
                                    10px;
                            "
                        >
                            ${provider}
                        </div>
                      `
                    : ""
            }

            <div class="task-meta-line">

                <span class="label">
                    Date
                </span>

                <span>

                    ${
                        actualClassDate
                            ? `${session.day}, ${formatDate(
                                actualClassDate
                            )}`
                            : session.day
                    }

                    ·
                    ${session.time}

                </span>

            </div>

            <div class="task-meta-line">

                <span class="label">
                    Lecture
                </span>

                <div style="flex:1;">
                    ${lectureHtml}
                </div>

            </div>

            ${
                workload
                    ? `
                        <div class="task-meta-line">

                            <span class="label">
                                Workload
                            </span>

                            <span>
                                ${workload}
                            </span>

                        </div>
                      `
                    : ""
            }

            <div class="task-meta-line">

                <span class="label">
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

if (completionRateBadge) {
    completionRateBadge.textContent =
        `${percentage}%`;
}

if (statCompletedEl) {
    statCompletedEl.textContent =
        completedCount;
}

if (statRemainingEl) {
    statRemainingEl.textContent =
        total -
        completedCount;
}

if (statCurrentWeekEl) {
    statCurrentWeekEl.textContent =
        `W${currentWeek}`;
}

}

// =====================================================
// 30. SYLLABUS OVERVIEW
//
// Week 1
//
//   PHIL101
//   Intro to Logic
//
//   Lecture 1 — ...
//   Lecture 2 — ...
//
//   POLS101
//   Basic Political Theory
//
//   Lecture 1 — ...
//
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
).forEach(
    week => {

        const weekData =
            syllabusData[
                week
            ] || [];

        // -----------------------------------------
        // GROUP BY COURSE
        // -----------------------------------------

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

        // -----------------------------------------
        // WEEK
        // -----------------------------------------

        let html = `

            <div
                class="
                    overview-week-group
                "
            >

                <div
                    class="week-toggle"
                    onclick="
                        toggleAccordion(
                            'week-content-${week}',
                            this
                        )
                    "
                >
                    Week ${week}
                    Curriculum
                </div>

                <div
                    id="week-content-${week}"
                    class="week-content"
                >

                    <div
                        style="
                            display:flex;
                            flex-direction:column;
                            gap:24px;
                        "
                    >

        `;

        // -----------------------------------------
        // COURSES
        // -----------------------------------------

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
                            padding-bottom:
                                20px;
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
                                margin-bottom:
                                    8px;
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
                                color:
                                    var(--text-primary);
                                display:block;
                                font-size:
                                    1rem;
                                margin-bottom:
                                    12px;
                            "
                        >
                            ${firstSession.name}
                        </strong>

                `;

                // ---------------------------------
                // EACH SESSION
                // ---------------------------------

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
                                                padding-left:
                                                    12px;
                                                margin-bottom:
                                                    8px;
                                                line-height:
                                                    1.5;
                                            "
                                        >

                                            <span
                                                style="
                                                    color:
                                                        var(--primary-green);
                                                    font-weight:
                                                        600;
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

                        } else {

                            html += `

                                <div
                                    style="
                                        padding-left:
                                            12px;
                                        margin-bottom:
                                            8px;
                                    "
                                >

                                    <span
                                        style="
                                            color:
                                                var(--primary-green);
                                            font-weight:
                                                600;
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
                                                        margin-top:
                                                            3px;
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
                                        padding-left:
                                            12px;
                                        margin-top:
                                            10px;
                                        color:
                                            var(--text-muted);
                                        font-size:
                                            0.8rem;
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

// =====================================================
// ACCORDION
// =====================================================

window.toggleAccordion =
function (
contentId,
element
) {

    const content =
        document.getElementById(
            contentId
        );

    if (!content) {
        return;
    }

    content.classList.toggle(
        "expanded"
    );

    element.classList.toggle(
        "open"
    );
};

// =====================================================
// LIVE UPDATE
// =====================================================

setInterval(
() => {

    if (!semesterStarted) {
        return;
    }

    const calculatedWeek =
        calculateCurrentWeek();

    const weekExists =
        syllabusData[
            String(calculatedWeek)
        ];

    if (
        weekExists &&
        currentWeek !==
            String(calculatedWeek)
    ) {

        currentWeek =
            String(calculatedWeek);

        if (weekSelector) {
            weekSelector.value =
                currentWeek;
        }
    }

    renderSemesterStatus();
    renderApp();

},
60 * 1000

);

// =====================================================
// START
// =====================================================

UpdateCurrentDateDisplay();     
loadSyllabus();
