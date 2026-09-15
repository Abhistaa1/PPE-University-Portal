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
// RESET ALL PROGRESS + RESET STUDY START
// =====================================================

window.resetProgress = function () {

    const confirmed = window.confirm(
        "Reset everything?\n\n" +
        "This will erase:\n" +
        "• Watched lectures\n" +
        "• Completed sessions\n" +
        "• Attendance history\n" +
        "• Semester start date\n\n" +
        "Your syllabus, schedule, and lecture links will NOT be changed."
    );

    if (!confirmed) {
        return;
    }

    // Clear lecture progress
    localStorage.removeItem("ppe_progress_state");
    localStorage.removeItem("ppe_watched_state");
    localStorage.removeItem("ppe_completed_sessions");
    localStorage.removeItem("ppe_attendance_state");

    // Clear semester / study start
    localStorage.removeItem("semester_started");
    localStorage.removeItem("semester_start_date");

    // Reset memory
    progressState = {};
    watchedState = {};
    completedSessions = {};

    semesterStarted = false;
    semesterStartDate = null;
    currentWeek = "1";

    // Reset week selector
    if (weekSelector) {
        weekSelector.value = "1";
    }

    // Re-render everything
    renderSemesterStatus();
    renderApp();
    renderOverview();

    // Reload so the Start Studying UI is restored
    window.location.reload();
};

// =====================================================
// VIDEO HELPERS
// =====================================================

function getSessionId(session) {

    if (session.id) {
        return String(session.id);
    }

    return [
        session.week || "",
        session.day || "",
        session.time || "",
        session.course || session.code || "",
        session.title || session.name || ""
    ].join("_");
}

function getVideoId(video) {

    if (!video) {
        return null;
    }

    if (video.id) {
        return String(video.id);
    }

    if (video.videoId) {
        return String(video.videoId);
    }

    if (video.url) {

        const match =
            String(video.url).match(
                /(?:v=|youtu\.be\/)([^&?/]+)/
            );

        if (match) {
            return match[1];
        }
    }

    return null;
}

function getVideoUrl(video) {

    if (!video) {
        return "#";
    }

    if (video.url) {
        return video.url;
    }

    const id =
        getVideoId(video);

    if (id) {
        return `https://www.youtube.com/watch?v=${id}`;
    }

    return "#";
}

function getSessionVideos(session) {

    if (!session) {
        return [];
    }

    if (
        Array.isArray(
            session.videos
        )
    ) {
        return session.videos;
    }

    if (
        Array.isArray(
            session.lectures
        )
    ) {
        return session.lectures;
    }

    if (
        session.video
    ) {
        return [session.video];
    }

    if (
        session.videoId ||
        session.url
    ) {
        return [session];
    }

    return [];
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

    const title =
        String(
            video.title ||
            video.name ||
            ""
        );

    let match =
        title.match(
            /^\s*(?:lecture|lec)\s*\.?\s*(\d+)/i
        );

    if (match) {
        return Number(match[1]);
    }

    match =
        title.match(
            /^\s*(\d+)\s*[.)-]/
        );

    if (match) {
        return Number(match[1]);
    }

    return null;
}

function getDisplayLectureTitle(video) {

    if (!video) {
        return "";
    }

    if (video.displayTitle) {
        return video.displayTitle;
    }

    let title =
        String(
            video.title ||
            video.name ||
            ""
        ).trim();

    title =
        title.replace(
            /^\s*(?:lecture|lec)\s*\.?\s*\d+\s*[:.)-]?\s*/i,
            ""
        );

    title =
        title.replace(
            /^\s*\d+\s*[.)-]\s*/,
            ""
        );

    return title.trim();
}

function isVideoWatched(video) {

    const id =
        getVideoId(video);

    if (!id) {
        return false;
    }

    return Boolean(
        watchedState[id]
    );
}

function markVideoWatched(video) {

    const id =
        getVideoId(video);

    if (!id) {
        return;
    }

    watchedState[id] = true;

    saveState();
}

function allSessionVideosWatched(session) {

    const videos =
        getSessionVideos(session);

    if (videos.length === 0) {
        return true;
    }

    return videos.every(
        video =>
            isVideoWatched(video)
    );
}

function isSessionCompleted(session) {

    const id =
        getSessionId(session);

    if (
        completedSessions[id]
    ) {
        return true;
    }

    return Boolean(
        progressState[id]
    );
}

// =====================================================
// WATCH VIDEO
// =====================================================

window.recordAttendance =
    function (
        sessionId,
        videoId
    ) {

        const session =
            findSessionById(
                sessionId
            );

        if (!session) {
            return;
        }

        if (videoId) {
            watchedState[
                videoId
            ] = true;
        } else {

            const videos =
                getSessionVideos(
                    session
                );

            videos.forEach(
                video => {

                    const id =
                        getVideoId(
                            video
                        );

                    if (id) {
                        watchedState[id] = true;
                    }
                }
            );
        }

        saveState();

        renderApp();
    };

// =====================================================
// TOGGLE DONE
// =====================================================

window.toggleDone =
    function (sessionId) {

        const session =
            findSessionById(
                sessionId
            );

        if (!session) {
            return;
        }

        const id =
            getSessionId(
                session
            );

        if (
            isSessionCompleted(
                session
            )
        ) {

            delete progressState[id];

            delete completedSessions[id];

        } else {

            if (
                !allSessionVideosWatched(
                    session
                )
            ) {

                alert(
                    "Watch all lecture videos first."
                );

                return;
            }

            progressState[id] = true;
            completedSessions[id] = true;
        }

        saveProgress(
            completedSessions
        );

        saveState();

        renderApp();
        renderOverview();
    };

// =====================================================
// RESET ALL PROGRESS
// =====================================================

window.resetProgress = function () {

    const confirmed = window.confirm(
        "Reset all progress?\n\n" +
        "This will erase watched lectures and completed sessions.\n\n" +
        "Your syllabus, schedule, and lecture links will NOT be changed."
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(
        "ppe_progress_state"
    );

    localStorage.removeItem(
        "ppe_watched_state"
    );

    localStorage.removeItem(
        "ppe_completed_sessions"
    );

    localStorage.removeItem(
        "ppe_attendance_state"
    );

    progressState = {};
    watchedState = {};
    completedSessions = {};

    renderApp();
    renderOverview();

    alert(
        "Progress has been reset."
    );
};

// =====================================================
// FIND SESSION
// =====================================================

function findSessionById(sessionId) {

    const target =
        String(sessionId);

    for (
        const weekKey
        of Object.keys(syllabusData)
    ) {

        const week =
            syllabusData[
                weekKey
            ];

        if (
            !week ||
            !Array.isArray(
                week.sessions
            )
        ) {
            continue;
        }

        for (
            const session
            of week.sessions
        ) {

            if (
                getSessionId(
                    session
                ) === target
            ) {
                return session;
            }
        }
    }

    return null;
}

// =====================================================
// FORMAT DURATION
// =====================================================

function formatMinutes(minutes) {

    const total =
        Number(minutes);

    if (
        !Number.isFinite(total)
    ) {
        return "TBD";
    }

    const hours =
        Math.floor(
            total / 60
        );

    const mins =
        total % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }

    return `${mins}m`;
}

function parseDuration(value) {

    if (
        typeof value === "number"
    ) {
        return value;
    }

    if (!value) {
        return null;
    }

    const text =
        String(value)
            .trim();

    if (
        /^\d+(\.\d+)?$/.test(
            text
        )
    ) {
        return Number(text);
    }

    const hms =
        text.match(
            /^(?:(\d+):)?(\d+):(\d+)$/
        );

    if (hms) {

        const hours =
            Number(
                hms[1] || 0
            );

        const minutes =
            Number(
                hms[2]
            );

        const seconds =
            Number(
                hms[3]
            );

        return (
            hours * 60 +
            minutes +
            Math.round(
                seconds / 60
            )
        );
    }

    const hourMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*h/i
        );

    const minuteMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*m/i
        );

    if (
        hourMatch ||
        minuteMatch
    ) {

        const hours =
            hourMatch
                ? Number(
                    hourMatch[1]
                )
                : 0;

        const minutes =
            minuteMatch
                ? Number(
                    minuteMatch[1]
                )
                : 0;

        return Math.round(
            hours * 60 +
            minutes
        );
    }

    return null;
}

function getVideoDuration(video) {

    if (!video) {
        return null;
    }

    return parseDuration(
        video.durationMinutes ??
        video.duration ??
        video.length
    );
}

function getSessionWorkload(session) {

    const videos =
        getSessionVideos(
            session
        );

    if (
        videos.length > 0
    ) {

        const durations =
            videos.map(
                getVideoDuration
            );

        if (
            durations.some(
                value =>
                    value === null
            )
        ) {
            return null;
        }

        return durations.reduce(
            (
                total,
                value
            ) =>
                total + value,
            0
        );
    }

    return parseDuration(
        session.workloadMinutes ??
        session.durationMinutes ??
        session.duration
    );
}

// =====================================================
// COURSE HELPERS
// =====================================================

function getCourseCode(session) {

    return (
        session.course ||
        session.code ||
        session.courseCode ||
        ""
    );
}

function getCourseName(session) {

    return (
        session.courseName ||
        session.courseTitle ||
        session.name ||
        session.title ||
        "Academic Session"
    );
}

function getProfessor(session) {

    return (
        session.professor ||
        session.instructor ||
        session.prof ||
        ""
    );
}

function getReading(session) {

    return (
        session.book ||
        session.reading ||
        ""
    );
}

function getDetails(session) {

    return (
        session.details ||
        session.description ||
        ""
    );
}

// =====================================================
// SEMESTER STATUS
// =====================================================

function renderSemesterStatus() {

    const currentDateDisplay =
        document.getElementById(
            "currentDateDisplay"
        );

    if (currentDateDisplay) {

        currentDateDisplay.textContent =
            formatDateLong(
                new Date()
            );
    }

    if (
        statCurrentWeekEl
    ) {

        statCurrentWeekEl.textContent =
            `W${currentWeek}`;
    }
}

// =====================================================
// WEEK DROPDOWN
// =====================================================

function populateDropdown() {

    if (!weekSelector) {
        return;
    }

    weekSelector.innerHTML = "";

    const weeks =
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
        );

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

            if (
                week ===
                currentWeek
            ) {
                option.selected =
                    true;
            }

            weekSelector.appendChild(
                option
            );
        }
    );

    weekSelector.onchange =
        function () {

            currentWeek =
                this.value;

            renderApp();
        };
}

// =====================================================
// RENDER APP
// =====================================================

function renderApp() {

    if (!courseListEl) {
        return;
    }

    const week =
        syllabusData[
            String(currentWeek)
        ];

    if (!week) {

        courseListEl.innerHTML = `
            <div class="clean-card">
                <h4>No sessions scheduled.</h4>
            </div>
        `;

        updateProgressMetrics();

        return;
    }

    const sessions =
        Array.isArray(
            week.sessions
        )
            ? week.sessions
            : [];

    courseListEl.innerHTML = "";

    if (
        sessions.length === 0
    ) {

        courseListEl.innerHTML = `
            <div class="clean-card">
                <h4>No sessions scheduled.</h4>
            </div>
        `;

        updateProgressMetrics();

        return;
    }

    sessions.forEach(
        session => {

            courseListEl.appendChild(
                createSessionCard(
                    session
                )
            );
        }
    );

    updateProgressMetrics();
}

// =====================================================
// CREATE SESSION CARD
// =====================================================

function createSessionCard(session) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "clean-card session-card";

    const sessionId =
        getSessionId(
            session
        );

    const videos =
        getSessionVideos(
            session
        );

    const completed =
        isSessionCompleted(
            session
        );

    const allWatched =
        allSessionVideosWatched(
            session
        );

    const workload =
        getSessionWorkload(
            session
        );

    const code =
        getCourseCode(
            session
        );

    const courseName =
        getCourseName(
            session
        );

    const professor =
        getProfessor(
            session
        );

    const reading =
        getReading(
            session
        );

    const date =
        getScheduledDateTime(
            session
        );

    const dateText =
        date
            ? formatDate(
                date
            )
            : (
                session.date ||
                "TBD"
            );

    const timeText =
        session.time ||
        "TBD";

    let lectureHtml = "";

    if (
        videos.length > 0
    ) {

        lectureHtml =
            videos.map(
                video => {

                    const videoId =
                        getVideoId(
                            video
                        );

                    const title =
                        getDisplayLectureTitle(
                            video
                        );

                    const number =
                        getLectureNumber(
                            video
                        );

                    const duration =
                        getVideoDuration(
                            video
                        );

                    const watched =
                        isVideoWatched(
                            video
                        );

                    const label =
                        number !== null
                            ? `Lecture ${number}`
                            : "Lecture";

                    const watchedText =
                        watched
                            ? " ✓ Watched"
                            : "";

                    return `
                        <div
                            class="lecture-row"
                            style="
                                margin-bottom:10px;
                            "
                        >

                            <a
                                href="${getVideoUrl(video)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                onclick="
                                    recordAttendance(
                                        '${sessionId}',
                                        '${videoId || ""}'
                                    )
                                "
                                style="
                                    color:var(--primary-green);
                                    font-weight:600;
                                    text-decoration:none;
                                "
                            >

                                ${label}
                                — ${title}

                            </a>

                            ${
                                duration !== null
                                    ? `
                                        <span
                                            style="
                                                color:var(--text-muted);
                                                margin-left:8px;
                                            "
                                        >
                                            ${formatMinutes(duration)}
                                        </span>
                                    `
                                    : ""
                            }

                            ${
                                watchedText
                            }

                        </div>
                    `;
                }
            ).join("");
    } else {

        lectureHtml = `
            <div>
                ${
                    session.material ||
                    "Academic Session"
                }
            </div>
        `;
    }

    card.innerHTML = `

        <div class="card-head">

            <span class="badge badge-sub">
                ${code}
            </span>

            <span
                class="
                    status-badge
                    ${
                        completed
                            ? "completed"
                            : (
                                allWatched
                                    ? "ready"
                                    : "attendance-required"
                            )
                    }
                "
            >
                ${
                    completed
                        ? "Completed"
                        : (
                            allWatched
                                ? "Ready"
                                : "Attendance Required"
                        )
                }
            </span>

        </div>

        <h4>
            ${courseName}
        </h4>

        ${
            professor
                ? `
                    <div
                        class="professor"
                    >
                        ${professor}
                    </div>
                `
                : ""
        }

        <div class="session-info">

            <div>
                <strong>Date</strong>
                <span>
                    ${dateText}
                    ${
                        timeText !== "TBD"
                            ? ` · ${timeText}`
                            : ""
                    }
                </span>
            </div>

            <div>

                <strong>Lecture</strong>

                <span>
                    ${lectureHtml}
                </span>

            </div>

            ${
                workload !== null
                    ? `
                        <div>

                            <strong>
                                Workload
                            </strong>

                            <span>
                                ${formatMinutes(workload)}
                            </span>

                        </div>
                    `
                    : ""
            }

            ${
                reading
                    ? `
                        <div>

                            <strong>
                                Reading
                            </strong>

                            <span>
                                ${reading}
                            </span>

                        </div>
                    `
                    : ""
            }

        </div>

        ${
            getDetails(session)
                ? `
                    <p
                        style="
                            color:var(--text-muted);
                            margin-top:12px;
                            line-height:1.5;
                        "
                    >
                        ${getDetails(session)}
                    </p>
                `
                : ""
        }

        <button
            type="button"
            class="
                action-btn
                done-btn
                ${
                    completed
                        ? "completed-btn"
                        : ""
                }
            "
            ${
                !allWatched &&
                !completed
                    ? "disabled"
                    : ""
            }
            onclick="
                toggleDone(
                    '${sessionId}'
                )
            "
        >

            ${
                completed
                    ? "Completed (Undo)"
                    : (
                        allWatched
                            ? "Mark as Done"
                            : "🔒 Watch Video to Unlock"
                    )
            }

        </button>

    `;

    return card;
}

// =====================================================
// UPDATE PROGRESS METRICS
// =====================================================

function getAllSessions() {

    const sessions = [];

    Object.keys(
        syllabusData
    ).forEach(
        weekKey => {

            const week =
                syllabusData[
                    weekKey
                ];

            if (
                week &&
                Array.isArray(
                    week.sessions
                )
            ) {

                sessions.push(
                    ...week.sessions
                );
            }
        }
    );

    return sessions;
}

function updateProgressMetrics() {

    const sessions =
        getAllSessions();

    const total =
        sessions.length;

    const completed =
        sessions.filter(
            session =>
                isSessionCompleted(
                    session
                )
        ).length;

    const remaining =
        Math.max(
            total -
            completed,
            0
        );

    const percentage =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 0;

    if (
        statCompletedEl
    ) {

        statCompletedEl.textContent =
            completed;
    }

    if (
        statRemainingEl
    ) {

        statRemainingEl.textContent =
            remaining;
    }

    if (
        completionRateBadge
    ) {

        completionRateBadge.textContent =
            `${percentage}%`;
    }

    if (
        progressFillEl
    ) {

        progressFillEl.style.width =
            `${percentage}%`;
    }
}

// =====================================================
// OVERVIEW
// =====================================================

function renderOverview() {

    const overviewEl =
        document.getElementById(
            "overviewContent"
        );

    if (!overviewEl) {
        return;
    }

    overviewEl.innerHTML = "";

    const weeks =
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
        );

    weeks.forEach(
        weekKey => {

            const week =
                syllabusData[
                    weekKey
                ];

            if (!week) {
                return;
            }

            const sessions =
                Array.isArray(
                    week.sessions
                )
                    ? week.sessions
                    : [];

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "clean-card overview-week-card";

            let html = `

                <div
                    class="card-head"
                >

                    <span
                        class="
                            badge
                            badge-sub
                        "
                    >
                        WEEK ${weekKey}
                    </span>

                </div>

                <h4>
                    ${
                        week.title ||
                        `Week ${weekKey}`
                    }
                </h4>

            `;

            if (
                week.details
            ) {

                html += `
                    <p
                        style="
                            color:var(--text-muted);
                            line-height:1.5;
                        "
                    >
                        ${week.details}
                    </p>
                `;
            }

            sessions.forEach(
                session => {

                    const videos =
                        getSessionVideos(
                            session
                        );

                    const code =
                        getCourseCode(
                            session
                        );

                    const firstSession =
                        session;

                    html += `

                        <div
                            style="
                                padding:16px 0;
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
                                    color:
                                        var(--text-primary);
                                    display:block;
                                    font-size:
                                        1rem;
                                    margin-bottom:
                                        12px;
                                "
                            >
                                ${getCourseName(firstSession)}
                            </strong>

                    `;

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

                    html += `
                        </div>
                    `;
                }
            );

            html += `
                </div>
            `;

            wrapper.innerHTML =
                html;

            overviewEl.appendChild(
                wrapper
            );
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
// LOAD SYLLABUS
// =====================================================

async function loadSyllabus() {

    try {

        const response =
            await fetch(
                "./data/syllabus.json"
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
            data.courseCatalog ||
            {};

        appSettings =
            data.settings ||
            {};

        if (
            semesterStarted
        ) {

            currentWeek =
                String(
                    calculateCurrentWeek()
                );
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

                <div class="clean-card">

                    <h4>
                        Unable to load syllabus
                    </h4>

                    <p
                        style="
                            color:var(--text-muted);
                        "
                    >
                        Please check that
                        data/syllabus.json
                        exists and try again.
                    </p>

                </div>

            `;
        }
    }
}

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

loadSyllabus();
