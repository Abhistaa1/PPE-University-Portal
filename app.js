// =====================================================
// PERSONAL UNIVERSITY PORTAL
// app.js
// =====================================================

// ========================================
// PERSISTENT USER PROGRESS
// ========================================

const STORAGE_KEY = "ppe_completed_sessions";

// Load saved progress
function loadSavedProgress() {
    try {
        return JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || {};
    } catch (error) {
        console.error(
            "Could not load saved progress:",
            error
        );
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
        console.error(
            "Could not save progress:",
            error
        );
    }
}

// Current completed sessions
let completedSessions =
    loadSavedProgress();


// =====================================================
// STATE
// =====================================================

let currentWeek = "1";

let syllabusData = {};

let courseCatalog = {};

let appSettings = {};


// =====================================================
// SEMESTER STATE
// =====================================================

let semesterStarted =
    localStorage.getItem(
        "semester_started"
    ) === "true";

let semesterStartDate =
    localStorage.getItem(
        "semester_start_date"
    ) || null;


// =====================================================
// PROGRESS STATE
// =====================================================

let progressState =
    JSON.parse(
        localStorage.getItem(
            "ppe_progress_state"
        )
    ) || {};

let watchedState =
    JSON.parse(
        localStorage.getItem(
            "ppe_watched_state"
        )
    ) || {};


// =====================================================
// DOM
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
// STORAGE
// =====================================================

function saveState() {

    localStorage.setItem(
        "ppe_progress_state",
        JSON.stringify(
            progressState
        )
    );

    localStorage.setItem(
        "ppe_watched_state",
        JSON.stringify(
            watchedState
        )
    );
}


// =====================================================
// TAB CONTROLLER
// =====================================================

window.switchTab = function (
    tabId
) {

    document
        .querySelectorAll(
            ".tab-content"
        )
        .forEach(
            el => {
                el.classList.remove(
                    "active"
                );
            }
        );

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            el => {
                el.classList.remove(
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
        overviewTab: 2,
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
// DATE HELPERS
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

    if (parts.length !== 3) {
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
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(date) {

    if (
        !date ||
        isNaN(date.getTime())
    ) {
        return "";
    }

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


function formatDateLong(date) {

    if (
        !date ||
        isNaN(date.getTime())
    ) {
        return "";
    }

    return date.toLocaleDateString(
        undefined,
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


// =====================================================
// SEMESTER WEEK CALCULATION
// =====================================================

function calculateCurrentWeek() {

    if (!semesterStartDate) {
        return 1;
    }

    const start =
        parseDateOnly(
            semesterStartDate
        );

    const today =
        parseDateOnly(
            toISODate(
                new Date()
            )
        );

    if (
        isNaN(start.getTime()) ||
        isNaN(today.getTime())
    ) {
        return 1;
    }

    const diff =
        today.getTime() -
        start.getTime();

    const days =
        Math.floor(
            diff /
            (
                24 *
                60 *
                60 *
                1000
            )
        );

    return (
        Math.floor(
            days / 7
        ) + 1
    );
}


// =====================================================
// START SEMESTER
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

window.resetSemester =
    function () {

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
            weekSelector.value =
                "1";
        }

        renderSemesterStatus();
        renderApp();
        renderOverview();
    };


// =====================================================
// VIDEO HELPERS
// =====================================================

function formatDuration(
    seconds
) {

    if (
        seconds === undefined ||
        seconds === null ||
        isNaN(seconds)
    ) {
        return "";
    }

    const totalSeconds =
        Number(seconds);

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (
                totalSeconds % 3600
            ) / 60
        );

    const secs =
        Math.floor(
            totalSeconds % 60
        );

    if (hours > 0) {

        return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {

        return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
}


function getVideo(
    courseCode,
    videoId
) {

    const course =
        courseCatalog[
            courseCode
        ];

    if (!course) {
        return null;
    }

    const videos =
        course.videos ||
        course.lectures ||
        [];

    return (
        videos.find(
            video =>
                String(
                    video.id
                ) ===
                String(videoId)
        ) || null
    );
}


function getSessionId(
    session
) {

    if (!session) {
        return "";
    }

    return (
        session.id ||
        `${session.code || "session"}-${session.date || ""}-${session.time || ""}`
    );
}


function getVideoId(
    video
) {

    if (!video) {
        return "";
    }

    return (
        video.id ||
        video.videoId ||
        video.youtubeId ||
        ""
    );
}


function getVideoUrl(
    video
) {

    if (!video) {
        return "#";
    }

    if (video.url) {
        return video.url;
    }

    if (
        video.youtubeUrl
    ) {
        return video.youtubeUrl;
    }

    const youtubeId =
        video.videoId ||
        video.youtubeId;

    if (youtubeId) {

        return (
            `https://www.youtube.com/watch?v=${youtubeId}`
        );
    }

    return "#";
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


function getLectureNumber(
    video
) {

    if (!video) {
        return "";
    }

    if (
        video.lectureNumber !==
        undefined
    ) {
        return video.lectureNumber;
    }

    if (
        video.number !==
        undefined
    ) {
        return video.number;
    }

    const title =
        video.title ||
        video.name ||
        "";

    const match =
        String(title).match(
            /^\s*(\d+)\s*[:.\-]/
        );

    return match
        ? match[1]
        : "";
}


function getDisplayLectureTitle(
    video
) {

    if (!video) {
        return "";
    }

    const title =
        video.title ||
        video.name ||
        "Lecture";

    return String(title)
        .replace(
            /^\s*\d+\s*[:.\-]\s*/,
            ""
        )
        .trim();
}


// =====================================================
// SESSION STATE
// =====================================================

function sessionWatched(
    session
) {

    const videos =
        getSessionVideos(
            session
        );

    if (videos.length === 0) {
        return false;
    }

    return videos.every(
        video =>
            watchedState[
                getVideoId(video)
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
            getSessionId(session)
        ] === true
    );
}


function isVideoWatched(
    video
) {

    if (!video) {
        return false;
    }

    return (
        watchedState[
            getVideoId(video)
        ] === true
    );
}


function allSessionVideosWatched(
    session
) {

    return sessionWatched(
        session
    );
}


function isSessionCompleted(
    session
) {

    return sessionDone(
        session
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

        if (!videoId) {
            return;
        }

        watchedState[
            videoId
        ] = true;

        saveState();

        renderApp();
        renderOverview();
    };


// =====================================================
// ATTENDANCE
// =====================================================

window.recordAttendance =
    function (
        sessionId,
        videoId
    ) {

        if (videoId) {

            watchedState[
                videoId
            ] = true;

            saveState();

            renderApp();
            renderOverview();

            return;
        }

        watchedState[
            sessionId
        ] = true;

        saveState();

        renderApp();
        renderOverview();
    };


// =====================================================
// COMPLETION
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
                    getSessionId(item) ===
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

            completedSessions[
                sessionId
            ] = false;

            saveState();
            saveProgress(
                completedSessions
            );

            renderApp();
            renderOverview();

            return;
        }

        const isAssessment =
            session.type ===
            "assessment";

        const isReview =
            session.type ===
            "review";

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

        saveProgress(
            completedSessions
        );

        renderApp();
        renderOverview();
    };


// =====================================================
// RESET ALL PROGRESS
// =====================================================

window.resetProgress =
    function () {

        const confirmed =
            window.confirm(
                "Reset all progress?\n\n" +
                "This will erase watched lectures and completed sessions.\n\n" +
                "Your syllabus, schedule, and lecture links will NOT be changed."
            );

        if (!confirmed) {
            return;
        }

        // Clear progress data
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

        // Reset semester start state too
        localStorage.removeItem(
            "semester_started"
        );

        localStorage.removeItem(
            "semester_start_date"
        );

        // Reset in-memory state
        progressState = {};

        watchedState = {};

        completedSessions = {};

        semesterStarted = false;

        semesterStartDate = null;

        currentWeek = "1";

        if (weekSelector) {
            weekSelector.value = "1";
        }

        // Rebuild the app
        renderSemesterStatus();

        renderApp();

        renderOverview();

        alert(
            "Progress has been reset."
        );
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

    weekSelector.value =
        currentWeek;

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
        };
}


// =====================================================
// PROGRESS CALCULATION
// =====================================================

function getAllSessions() {

    const sessions = [];

    Object.keys(
        syllabusData
    ).forEach(
        week => {

            const weekSessions =
                syllabusData[
                    week
                ] || [];

            weekSessions.forEach(
                session => {

                    sessions.push(
                        session
                    );
                }
            );
        }
    );

    return sessions;
}


function getTotalSessionCount() {

    return getAllSessions()
        .length;
}


function getCompletedSessionCount() {

    return getAllSessions()
        .filter(
            session =>
                sessionDone(
                    session
                )
        )
        .length;
}


function getOverallCompletionRate() {

    const total =
        getTotalSessionCount();

    if (total === 0) {
        return 0;
    }

    const completed =
        getCompletedSessionCount();

    return Math.round(
        (
            completed /
            total
        ) * 100
    );
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
                getTotalSessionCount();
        }

        if (statCurrentWeekEl) {
            statCurrentWeekEl.textContent =
                "W1";
        }

        return;
    }


    // -----------------------------------------------
    // ACTIVE SEMESTER
    // -----------------------------------------------

    const sessions =
        syllabusData[
            currentWeek
        ] || [];

    let completedCount = 0;


    sessions.forEach(
        (
            session,
            index
        ) => {

            const sessionId =
                getSessionId(
                    session
                );

            const done =
                sessionDone(
                    session
                );

            if (done) {
                completedCount++;
            }

            const videos =
                getSessionVideos(
                    session
                );

            const watched =
                sessionWatched(
                    session
                );

            const type =
                session.type ||
                "lecture";

            const isAssessment =
                type ===
                "assessment";

            const isReview =
                type ===
                "review";

            const duration =
                session.duration ||
                session.totalDuration ||
                "";

            const code =
                session.code ||
                "SESSION";

            const title =
                session.title ||
                session.name ||
                "Academic Session";

            const details =
                session.details ||
                "";

            const book =
                session.book ||
                "";

            const lectureCount =
                videos.length;


            let videoHTML = "";


            if (
                videos.length > 0
            ) {

                videoHTML = `
                    <div
                        class="session-videos"
                        style="
                            margin-top:16px;
                        "
                    >

                        ${videos
                            .map(
                                (
                                    video,
                                    videoIndex
                                ) => {

                                    const videoId =
                                        getVideoId(
                                            video
                                        );

                                    const watchedVideo =
                                        isVideoWatched(
                                            video
                                        );

                                    const videoTitle =
                                        getDisplayLectureTitle(
                                            video
                                        );

                                    const lectureNumber =
                                        getLectureNumber(
                                            video
                                        );

                                    const url =
                                        getVideoUrl(
                                            video
                                        );

                                    const videoDuration =
                                        video.duration ||
                                        video.durationSeconds
                                            ? formatDuration(
                                                video.duration ||
                                                video.durationSeconds
                                            )
                                            : "";

                                    return `
                                        <div
                                            class="video-row"
                                            style="
                                                display:flex;
                                                align-items:center;
                                                gap:10px;
                                                padding:10px 0;
                                                border-top:1px solid rgba(0,0,0,0.06);
                                            "
                                        >

                                            <div
                                                style="
                                                    min-width:28px;
                                                    font-size:0.75rem;
                                                    color:var(--text-muted);
                                                "
                                            >
                                                ${
                                                    lectureNumber ||
                                                    videoIndex + 1
                                                }
                                            </div>

                                            <div
                                                style="
                                                    flex:1;
                                                    min-width:0;
                                                "
                                            >

                                                <a
                                                    href="${url}"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style="
                                                        color:inherit;
                                                        text-decoration:none;
                                                        font-weight:600;
                                                        font-size:0.86rem;
                                                    "
                                                >
                                                    ${videoTitle}
                                                </a>

                                                ${
                                                    videoDuration
                                                        ? `
                                                            <div
                                                                style="
                                                                    color:var(--text-muted);
                                                                    font-size:0.72rem;
                                                                    margin-top:3px;
                                                                "
                                                            >
                                                                ${videoDuration}
                                                            </div>
                                                        `
                                                        : ""
                                                }

                                            </div>

                                            <button
                                                type="button"
                                                class="task-btn"
                                                style="
                                                    width:auto;
                                                    min-width:76px;
                                                    padding:7px 10px;
                                                    font-size:0.72rem;
                                                "
                                                onclick="recordVideoWatch(
                                                    '${sessionId}',
                                                    '${videoId}'
                                                )"
                                            >
                                                ${
                                                    watchedVideo
                                                        ? "Watched"
                                                        : "Mark Watched"
                                                }
                                            </button>

                                        </div>
                                    `;
                                }
                            )
                            .join("")}

                    </div>
                `;
            }


            let actionHTML = "";


            if (
                !isAssessment &&
                !isReview &&
                videos.length > 0 &&
                !watched
            ) {

                actionHTML = `
                    <div
                        style="
                            margin-top:14px;
                            padding:10px 12px;
                            border-radius:10px;
                            background:rgba(0,0,0,0.035);
                            color:var(--text-muted);
                            font-size:0.78rem;
                        "
                    >
                        Watch all lectures to unlock completion.
                    </div>
                `;
            }


            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "clean-card session-card";


            card.innerHTML = `

                <div
                    class="card-head"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:10px;
                    "
                >

                    <span
                        class="badge badge-sub"
                    >
                        ${code}
                    </span>

                    <span
                        style="
                            font-size:0.75rem;
                            color:var(--text-muted);
                        "
                    >
                        ${done
                            ? "Completed"
                            : isAssessment
                                ? "Assessment"
                                : isReview
                                    ? "Review"
                                    : "Attendance Required"}
                    </span>

                </div>


                <h4
                    style="
                        margin-top:12px;
                    "
                >
                    ${title}
                </h4>


                ${
                    details
                        ? `
                            <p
                                style="
                                    color:var(--text-secondary);
                                    font-size:0.82rem;
                                    line-height:1.5;
                                    margin-top:7px;
                                "
                            >
                                ${details}
                            </p>
                        `
                        : ""
                }


                <div
                    style="
                        display:flex;
                        flex-wrap:wrap;
                        gap:8px;
                        margin-top:12px;
                    "
                >

                    ${
                        duration
                            ? `
                                <span
                                    class="badge"
                                >
                                    ${duration}
                                </span>
                            `
                            : ""
                    }

                    ${
                        lectureCount
                            ? `
                                <span
                                    class="badge"
                                >
                                    ${lectureCount}
                                    ${
                                        lectureCount === 1
                                            ? " lecture"
                                            : " lectures"
                                    }
                                </span>
                            `
                            : ""
                    }

                </div>


                ${videoHTML}


                ${
                    book
                        ? `
                            <div
                                style="
                                    padding-left:12px;
                                    margin-top:10px;
                                    color:var(--text-muted);
                                    font-size:0.8rem;
                                "
                            >
                                Reading:
                                ${book}
                            </div>
                        `
                        : ""
                }


                ${actionHTML}


                <div
                    style="
                        display:flex;
                        justify-content:flex-end;
                        margin-top:16px;
                    "
                >

                    <button
                        type="button"
                        class="task-btn"
                        onclick="toggleDone(
                            '${sessionId}'
                        )"
                        ${
                            !done &&
                            !isAssessment &&
                            !isReview &&
                            videos.length > 0 &&
                            !watched
                                ? "disabled"
                                : ""
                        }
                    >
                        ${
                            done
                                ? "Mark Incomplete"
                                : "Complete Session"
                        }
                    </button>

                </div>

            `;


            courseListEl.appendChild(
                card
            );
        }
    );


    // -----------------------------------------------
    // EMPTY WEEK
    // -----------------------------------------------

    if (
        sessions.length === 0
    ) {

        courseListEl.innerHTML = `

            <div
                class="clean-card"
                style="
                    text-align:center;
                    padding:30px 20px;
                "
            >

                <h4>
                    No sessions scheduled
                </h4>

                <p
                    style="
                        color:var(--text-muted);
                        margin-top:8px;
                    "
                >
                    There are no academic sessions
                    listed for Week ${currentWeek}.
                </p>

            </div>

        `;
    }


    // -----------------------------------------------
    // CURRENT WEEK STATS
    // -----------------------------------------------

    if (statCurrentWeekEl) {

        statCurrentWeekEl.textContent =
            `W${currentWeek}`;
    }


    const total =
        getTotalSessionCount();

    const completed =
        getCompletedSessionCount();

    const remaining =
        Math.max(
            0,
            total - completed
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
            completed;
    }


    if (statRemainingEl) {

        statRemainingEl.textContent =
            remaining;
    }
}


// =====================================================
// OVERVIEW
// =====================================================

function renderOverview() {

    const overviewEl =
        document.getElementById(
            "overviewContent"
        ) ||
        document.getElementById(
            "overviewList"
        );

    if (!overviewEl) {
        return;
    }

    overviewEl.innerHTML = "";


    const weeks =
        Object.keys(
            syllabusData
        );


    if (weeks.length === 0) {

        overviewEl.innerHTML = `
            <p
                style="
                    color:var(--text-muted);
                    text-align:center;
                    padding:30px;
                "
            >
                No syllabus data available.
            </p>
        `;

        return;
    }


    weeks.forEach(
        week => {

            const sessions =
                syllabusData[
                    week
                ] || [];


            const completed =
                sessions.filter(
                    session =>
                        sessionDone(
                            session
                        )
                ).length;


            const total =
                sessions.length;


            const isCurrent =
                String(week) ===
                String(currentWeek);


            let html = `

                <div
                    class="clean-card overview-week"
                    style="
                        margin-bottom:14px;
                    "
                >

                    <div
                        class="accordion-header"
                        onclick="toggleAccordion(
                            'overview-week-${week}',
                            this
                        )"
                        style="
                            cursor:pointer;
                            display:flex;
                            align-items:center;
                            justify-content:space-between;
                            gap:12px;
                        "
                    >

                        <div>

                            <span
                                class="badge badge-sub"
                            >
                                WEEK ${week}
                            </span>

                            <h4
                                style="
                                    margin-top:8px;
                                "
                            >
                                Week ${week}
                            </h4>

                        </div>


                        <div
                            style="
                                text-align:right;
                            "
                        >

                            <strong>
                                ${completed}/${total}
                            </strong>

                            <div
                                style="
                                    color:var(--text-muted);
                                    font-size:0.72rem;
                                    margin-top:3px;
                                "
                            >
                                ${
                                    isCurrent
                                        ? "Current week"
                                        : ""
                                }
                            </div>

                        </div>

                    </div>


                    <div
                        id="overview-week-${week}"
                        class="accordion-content"
                    >

            `;


            sessions.forEach(
                session => {

                    const sessionId =
                        getSessionId(
                            session
                        );

                    const done =
                        sessionDone(
                            session
                        );

                    const videos =
                        getSessionVideos(
                            session
                        );

                    const watched =
                        sessionWatched(
                            session
                        );

                    const title =
                        session.title ||
                        session.name ||
                        "Academic Session";

                    const code =
                        session.code ||
                        "SESSION";

                    const type =
                        session.type ||
                        "lecture";


                    html += `

                        <div
                            style="
                                padding:14px 0;
                                border-top:1px solid rgba(0,0,0,0.06);
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    gap:12px;
                                "
                            >

                                <div>

                                    <div
                                        style="
                                            font-size:0.72rem;
                                            color:var(--text-muted);
                                            margin-bottom:4px;
                                        "
                                    >
                                        ${code}
                                    </div>

                                    <strong>
                                        ${title}
                                    </strong>

                                    ${
                                        session.details
                                            ? `
                                                <span
                                                    style="
                                                        display:block;
                                                        color:var(--text-secondary);
                                                        margin-top:3px;
                                                    "
                                                >
                                                    ${session.details}
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>


                                <div
                                    style="
                                        text-align:right;
                                        font-size:0.72rem;
                                        color:var(--text-muted);
                                    "
                                >

                                    ${
                                        done
                                            ? "✓ Completed"
                                            : watched
                                                ? "Watched"
                                                : type
                                    }

                                </div>

                            </div>


                            ${
                                videos.length > 0
                                    ? `
                                        <div
                                            style="
                                                padding-left:12px;
                                                margin-top:9px;
                                                color:var(--text-muted);
                                                font-size:0.76rem;
                                            "
                                        >
                                            ${videos.length}
                                            ${
                                                videos.length === 1
                                                    ? " lecture"
                                                    : " lectures"
                                            }
                                        </div>
                                    `
                                    : ""
                            }


                            ${
                                session.book
                                    ? `
                                        <div
                                            style="
                                                padding-left:12px;
                                                margin-top:10px;
                                                color:var(--text-muted);
                                                font-size:0.8rem;
                                            "
                                        >
                                            Reading:
                                            ${session.book}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                    `;
                }
            );


            html += `

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

        if (element) {

            element.classList.toggle(
                "open"
            );
        }
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
