// Hide the main content area when the page loads
document.getElementById("main-content").style.display = "none";

// Get the logged-in user's username (used for detecting liked posts)
let currentUsername = null;

// GET CURRENT USER DETAILS FROM BACKEND
async function loadCurrentUser() {
    // Request the current session user from the backend
    const res = await fetch("/M01034045/login/check");
    // Convert response to JSON
    const data = await res.json();
    // Store username for later use
    currentUsername = data.username;
}

// SWITCH FROM LOGIN TO REGISTER SCREEN
document.getElementById("switch-to-register").addEventListener("click", () => {
    // Hide login section
    document.getElementById("login-section").classList.add("hidden");
    // Show register section
    document.getElementById("register-section").classList.remove("hidden");
});

//SWITCH FROM REGISTER TO LOGIN SCREEN
document.getElementById("switch-to-login").addEventListener("click", () => {
    // Hide register form
    document.getElementById("register-section").classList.add("hidden");
    // Show login form
    document.getElementById("login-section").classList.remove("hidden");
});

// LOGIN HANDLER
document.getElementById("login-btn").addEventListener("click", async () => {
    // Read username input
    const username = document.getElementById("login-username").value;
    // Read password input
    const password = document.getElementById("login-password").value;

    // Send login request to backend
    const res = await fetch("/M01034045/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    // Convert backend response into usable data
    const data = await res.json();

    // If login was successful
    if (res.ok) {
        // Hide login and register forms
        document.getElementById("login-section").classList.add("hidden");
        document.getElementById("register-section").classList.add("hidden");

        // Display the main content area
        document.getElementById("main-content").style.display = "block";

        // Load logged-in user information
        await loadCurrentUser();

        // Load the feed
        loadFeed();
    } else {
        // Show login failure message
        document.getElementById("login-feedback").innerHTML = data.message;
    }
});

// USER REGISTRATION HANDLER
document.getElementById("register-btn").addEventListener("click", async () => {
    // Read full name input
    const fullName = document.getElementById("reg-fullname").value;
    // Read username input
    const username = document.getElementById("reg-username").value;
    // Read password input
    const password = document.getElementById("reg-password").value;

    // Send registration request to backend
    const res = await fetch("/M01034045/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, password })
    });

    // Convert response to JSON
    const data = await res.json();

    // Inform user of result
    document.getElementById("reg-feedback").innerHTML = data.message;

    if (res.ok) {
        // Show success message for 2 seconds
        document.getElementById("reg-feedback").innerHTML = data.message;

        setTimeout(() => {
            // Hide register form
            document.getElementById("register-section").classList.add("hidden");
            // Show login form
            document.getElementById("login-section").classList.remove("hidden");

            // Clear the message after switching
            document.getElementById("reg-feedback").innerHTML = "";
        }, 2000); // 2000ms = 2 seconds
    }

});

// LOGOUT HANDLER
document.getElementById("logout-btn").addEventListener("click", async () => {
    // Send logout request to backend
    const res = await fetch("/M01034045/login", { method: "DELETE" });

    // If logout was successful
    if (res.ok) {
        // Hide the main content
        document.getElementById("main-content").style.display = "none";
        // Show login form again
        document.getElementById("login-section").classList.remove("hidden");
        // Hide register form
        document.getElementById("register-section").classList.add("hidden");
        // Clear login fields
        document.getElementById("login-username").value = "";
        document.getElementById("login-password").value = "";
    }
});

// NAVIGATION BUTTONS (Home, Explore, Create)
document.querySelectorAll(".nav-btn").forEach(btn => {
    // Add click event to each navigation button
    btn.addEventListener("click", () => {
        // Remove active highlight from all buttons
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        // Highlight the clicked button
        btn.classList.add("active");

        // Hide all sections
        document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));

        // Determine which section to display
        const target = btn.getAttribute("data-section");

        // Show selected section
        if (target) {
            document.getElementById(target).classList.remove("hidden");
        }

        // If Home is selected, reload feed
        if (target === "feed-section") {
            loadFeed();
        }

        // If Profile is selected, load profile page
        if (target === "profile-section") {
            loadProfile();
        }
    });
});

// EXPLORE PAGE TAB SWITCHING (Users <-> Posts)
document.getElementById("tab-users").addEventListener("click", () => {
    // Highlight Users tab
    document.getElementById("tab-users").classList.add("active");
    document.getElementById("tab-posts").classList.remove("active");

    // Show Users search content
    document.getElementById("explore-users").classList.remove("hidden");
    document.getElementById("explore-posts").classList.add("hidden");
});

document.getElementById("tab-posts").addEventListener("click", () => {
    // Highlight Posts tab
    document.getElementById("tab-posts").classList.add("active");
    document.getElementById("tab-users").classList.remove("active");

    // Show Posts search content
    document.getElementById("explore-posts").classList.remove("hidden");
    document.getElementById("explore-users").classList.add("hidden");
});


// CREATE POST HANDLER
document.getElementById("create-post-form").addEventListener("submit", async (e) => {
    // Prevent page refresh
    e.preventDefault();

    // Read selected image file
    const imageFile = document.getElementById("post-image").files[0];
    // Read caption text
    const caption = document.getElementById("post-caption").value;

    // Validate caption
    if (!caption.trim()) {
        document.getElementById("create-post-msg").innerText = "Caption cannot be empty.";
        return;
    }

    // Validate that an image was selected
    if (!imageFile) {
        document.getElementById("create-post-msg").innerText = "Please select an image.";
        return;
    }

    // Convert file to raw bytes
    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Send image + caption to backend
    const res = await fetch("/M01034045/contents", {
        method: "POST",
        headers: {
            "Content-Type": imageFile.type,
            "caption": caption
        },
        body: bytes
    });

    // Convert response to JSON
    const data = await res.json();

    // Display backend message
    document.getElementById("create-post-msg").innerText = data.message;

    // If post was created successfully
    if (res.ok) {
        // Clear caption field
        document.getElementById("post-caption").value = "";

        // Clear file input
        document.getElementById("post-image").value = "";

        // Remove preview image
        const preview = document.getElementById("image-preview");
        preview.src = "";
        preview.classList.add("hidden");

        // Show "Tap to add image" again
        document.querySelector(".upload-text").classList.remove("hidden");

        // Remove active border around upload box
        document.getElementById("image-preview-area").classList.remove("img-active");

        // Clear success message after 1.5s
        setTimeout(() => {
            document.getElementById("create-post-msg").innerText = "";
        }, 1500);

        // Reload feed to show new post
        loadFeed();
    }

});

// CREATE POST – IMAGE PICKER & PREVIEW HANDLING
// When the upload box is clicked, open the hidden file input
document.getElementById("image-preview-area").addEventListener("click", () => {
    document.getElementById("post-image").click();
});

// When a file is selected, show a preview inside the upload box
document.getElementById("post-image").addEventListener("change", function () {
    // Get the selected image file
    const file = this.files[0];

    // If no file selected, stop here
    if (!file) return;

    // Create a temporary URL for preview
    const imgURL = URL.createObjectURL(file);

    // Get preview image element
    const preview = document.getElementById("image-preview");

    // Set the preview image source
    preview.src = imgURL;

    // Show the image and hide the "Tap to add image" text
    preview.classList.remove("hidden");
    document.querySelector(".upload-text").classList.add("hidden");

    // Add a border to indicate active preview
    document.getElementById("image-preview-area").classList.add("img-active");
});

// LOAD FEED (FETCH POSTS)
async function loadFeed(page = 1) {
    // Ensure current username is set
    await loadCurrentUser();

    // Request feed data from backend
    const res = await fetch(`/M01034045/feed?page=${page}&limit=5`);

    // Convert response to JSON
    const data = await res.json();

    document.getElementById("feed-list").innerHTML = ""; // Clear feed first

    // If feed is empty message received
    if (Array.isArray(data.posts) && data.posts.length === 0) {
        document.getElementById("feed-list").innerHTML = `<p>${data.message}</p>`;
        return;
    }

    // Extract posts array from response
    const posts = data.posts || data;

    // Reference to the feed container in the DOM
    const container = document.getElementById("feed-list");

    // Clear existing feed
    container.innerHTML = "";

    // If no posts exist
    if (!Array.isArray(posts) || posts.length === 0) {
        container.innerHTML = "<p>No posts yet.</p>";
        return;
    }

    // Loop through each post and render it
    posts.forEach((post) => {
        // Create container for a post card
        const div = document.createElement("div");
        div.classList.add("feed-card");

        // Determine if logged-in user liked this post
        const liked = post.likes?.includes(currentUsername);

        // Build the HTML for the post
        div.innerHTML = `
    <div class="feed-header-row">
        <div>
            <p class="feed-name"><strong>${post.fullName}</strong></p>
            <p class="feed-username">@${post.user}</p>
        </div>
        <small class="feed-time">${new Date(post.createdAt).toLocaleString()}</small>
    </div>

    <img src="/uploads/${post.image}" class="feed-image" alt="Post Image">

    <p class="feed-caption">${post.caption}</p>

    <div class="like-row">
        <button class="like-btn ${liked ? "liked" : ""}" data-id="${post._id}">
            ❤️
        </button>
        <span class="like-count">${post.likes?.length || 0}</span>
    </div>

    <div class="comment-section">
        <h4>Comments</h4>
        <div class="comment-list">
            ${post.comments?.slice(0, 3).map(c => `
                <p><strong>${c.fullName}</strong>: ${c.text}</p>
            `).join("") || "<p>No comments yet.</p>"}
            ${post.comments?.length > 3 ? `
                <p class="view-comments" data-id="${post._id}">
                    View all ${post.comments.length} comments
                </p>` : ""}
        </div>

        <input type="text" class="comment-input" data-id="${post._id}" placeholder="Add a comment...">

        <button class="comment-btn" data-id="${post._id}">
            Post
        </button>
        <p id="comment-feedback-${post._id}" class="comment-feedback"></p>
    </div>
`;


        // Add post card to feed
        container.appendChild(div);
    });
    // Show user recommendations below the feed
    showRecommendations();

    // Add pagination controls
    addPaginationControls(page, data.totalPages);
}

// Add Prev / Next page buttons under the feed
function addPaginationControls(current, total) {
    const container = document.getElementById("feed-list");

    const nav = document.createElement("div");
    nav.classList.add("pagination-controls");

    // Basic pagination UI
    nav.innerHTML = `
        <button id="prev-page" ${current <= 1 ? "disabled" : ""}>Previous</button>
        <span>Page ${current} of ${total}</span>
        <button id="next-page" ${current >= total ? "disabled" : ""}>Next</button>
    `;

    container.appendChild(nav);

    // When previous button is clicked, load previous page
    document.getElementById("prev-page").addEventListener("click", () => {
        loadFeed(current - 1);
    });

    // When next button is clicked, load next page
    document.getElementById("next-page").addEventListener("click", () => {
        loadFeed(current + 1);
    });
}

// SHOW USER RECOMMENDATIONS IN FEED
async function showRecommendations() {
    // Fetch recommended users from backend
    const res = await fetch("/M01034045/recommendations");
    const users = await res.json(); // Extract user array

    // If no recommendations
    if (!Array.isArray(users) || users.length === 0) return;

    // Reference to feed container
    const container = document.getElementById("feed-list");

    // Create recommendations card
    const div = document.createElement("div");
    div.classList.add("feed-card"); // Reuse feed-card styling

    // Build recommendations HTML
    div.innerHTML = `
        <h3>Recommended for you</h3>
        ${users.map(u => `
            <div class="recommended-user">
                <p><strong>${u.fullName}</strong> (@${u.username})</p>
                <button class="btn follow-btn" data-username="${u.username}">Follow</button>
                <!-- Follow feedback message area -->
                <p id="follow-feedback" class="follow-feedback"></p>
            </div>
        `).join("")}
    `;

    // Add recommendations card to feed
    container.appendChild(div);
}

// LIKE / UNLIKE POST HANDLER
document.addEventListener("click", async (e) => {
    // Only proceed if user clicked a like button
    if (!e.target.classList.contains("like-btn")) return;

    // The like button element
    const btn = e.target;
    // Post ID stored in button
    const postId = btn.dataset.id;
    // Determine whether user already liked this post
    const liked = btn.classList.contains("liked");

    // Update UI instantly for better responsiveness
    if (liked) {
        btn.classList.remove("liked");
    } else {
        btn.classList.add("liked");
    }

    // Select HTTP method based on like state
    const method = liked ? "DELETE" : "POST";

    // Send like/unlike request to backend
    const res = await fetch("/M01034045/like", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId })
    });

    // Refresh feed after backend confirmation
    if (res.ok) {
        loadFeed();
    }
});

// ADD COMMENT HANDLER
document.addEventListener("click", async (e) => {
    // Only proceed if comment button was clicked
    if (!e.target.classList.contains("comment-btn")) return;

    // Extract post ID from button
    const postId = e.target.dataset.id;

    // Find the matching input field for this comment
    const input = document.querySelector(`.comment-input[data-id="${postId}"]`);
    // Read comment text
    const text = input.value;

    // Instead of alert, show feedback below the comment button
    const feedback = document.getElementById(`comment-feedback-${postId}`);
    feedback.innerText = ""; // Clear previous feedback

    // Validate input
    if (!text.trim()) {
        feedback.innerText = "Comment cannot be empty.";
        return;
    }

    // Send comment to backend
    const res = await fetch("/M01034045/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, text })
    });

    // If comment submitted successfully
    if (res.ok) {
        // Clear comment input box
        input.value = "";
        // Reload feed to display comment
        loadFeed();
    }
});

// OPEN FULL COMMENT MODAL
document.addEventListener("click", async (e) => {
    // Only proceed if "view all comments" is clicked
    if (!e.target.classList.contains("view-comments")) return;

    // Extract post ID
    const postId = e.target.dataset.id;

    // Request full post from backend
    const res = await fetch(`/M01034045/contents/full?postId=${postId}`);
    // Convert to JSON
    const post = await res.json();

    // Create modal overlay
    const modal = document.createElement("div");
    modal.classList.add("modal-overlay");

    // Build modal content
    modal.innerHTML = `
        <div class="modal-box">
            <h3>All comments</h3>

            <div class="modal-comments">
                ${post.comments.map(c => `
                    <p>
                        <strong>${c.fullName}</strong>: ${c.text}<br>
                        <small>${new Date(c.createdAt).toLocaleString()}</small>
                    </p>
                `).join("")}
            </div>

            <button class="close-modal">Close</button>
        </div>
    `;

    // Add modal to document
    document.body.appendChild(modal);

    // Close modal on button click
    modal.querySelector(".close-modal").addEventListener("click", () => {
        modal.remove();
    });
});

// SEARCH USERS (with Follow / Unfollow detection)
document.getElementById("search-users-btn").addEventListener("click", async () => {

    // Get search query from input box
    const query = document.getElementById("search-users-input").value;

    // Fetch matching users from backend
    const res = await fetch(`/M01034045/users?q=${encodeURIComponent(query)}`);
    const results = await res.json();

    // Find container where results will be displayed
    const container = document.getElementById("search-users-results");

    // Clear old results
    container.innerHTML = "";

    // If nothing found, show a message
    if (results.length === 0) {
        container.innerHTML = "<p>No users found.</p>";
        return;
    }

    // Fetch list of users the current user is already following
    const followRes = await fetch("/M01034045/follows/me");
    const followingList = await followRes.json();

    // Display each user with a follow/unfollow button
    results.forEach(user => {

        // Check if current user is following this result
        const isFollowing = followingList.includes(user.username);

        // Create card for this user result
        const div = document.createElement("div");
        div.classList.add("feed-card");

        // Build user entry with dynamic button
        div.innerHTML = `
            <p><strong>${user.fullName}</strong> (@${user.username})</p>

            <!-- Toggle button (text changes depending on following state) -->
            <button class="btn follow-btn follow-toggle-btn"
                    data-username="${user.username}"
                    data-following="${isFollowing}">
                ${isFollowing ? "Unfollow" : "Follow"}
            </button>

            <!-- Space for follow/unfollow feedback -->
            <p class="follow-feedback"></p>
        `;

        // Add card to page
        container.appendChild(div);
    });
});


// FOLLOW BUTTON HANDLER
document.addEventListener("click", async (e) => {
    // Only proceed if follow button clicked
    if (!e.target.classList.contains("follow-btn")) return;

    // Extract username to follow
    const username = e.target.dataset.username;

    // Send follow request
    const res = await fetch("/M01034045/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    });

    // Convert response to JSON
    const data = await res.json();

    // Show follow confirmation
    document.getElementById("follow-feedback").innerText = data.message;

    // Clear message after 2 seconds
    setTimeout(() => {
        document.getElementById("follow-feedback").innerText = "";
    }, 2000);
});

// FOLLOW / UNFOLLOW TOGGLE HANDLER
document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("follow-toggle-btn")) return;

    const btn = e.target;
    const username = btn.dataset.username;
    const isFollowing = btn.dataset.following === "true";

    let res;

    if (isFollowing) {
        // UNFOLLOW
        res = await fetch("/M01034045/follow", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
    } else {
        // FOLLOW
        res = await fetch("/M01034045/follow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
    }

    const data = await res.json();

    // Update button text + state
    if (res.ok) {
        btn.innerText = isFollowing ? "Follow" : "Unfollow";
        btn.dataset.following = (!isFollowing).toString();
    }

    // Show feedback under the button
    btn.nextElementSibling.innerText = data.message;

    setTimeout(() => {
        btn.nextElementSibling.innerText = "";
    }, 2000);
});


// Clear user search results when input changes
document.getElementById("search-users-input").addEventListener("input", () => {
    document.getElementById("search-users-results").innerHTML = "";
    document.getElementById("fixtures-list").innerHTML = "";
});

// SEARCH POSTS BY CAPTION
document.getElementById("search-contents-btn").addEventListener("click", async () => {
    // Read search term
    const term = document.getElementById("search-contents-input").value;

    // Request matching posts
    const res = await fetch(`/M01034045/contents?q=${encodeURIComponent(term)}`);
    // Convert to JSON
    const results = await res.json();

    // Get results container
    const container = document.getElementById("search-contents-results");
    // Clear results
    container.innerHTML = "";

    // If no posts found
    if (results.length === 0) {
        container.innerHTML = "<p>No posts found.</p>";
        return;
    }

    // Display each matching post
    results.forEach(post => {
        // Create display card
        const div = document.createElement("div");
        div.classList.add("feed-card");

        // Build card HTML
        div.innerHTML = `
            <p><strong>${post.fullName}</strong> (@${post.user})</p>
            <p>${post.caption}</p>
            <small>${new Date(post.createdAt).toLocaleString()}</small>
        `;

        // Add card to container
        container.appendChild(div);
    });
});

// Clear post search results when input changes
document.getElementById("search-contents-input").addEventListener("input", () => {
    document.getElementById("search-contents-results").innerHTML = "";
    document.getElementById("fixtures-list").innerHTML = "";
});

// Load Manchester United fixtures on button click
document.getElementById("load-fixtures-btn").addEventListener("click", async () => {
    // Fetch fixtures from backend using GET method
    const res = await fetch("/M01034045/fixtures");

    // Convert response to JSON
    const fixtures = await res.json();

    // Get reference to the display area
    const container = document.getElementById("fixtures-list");

    // Clear any previous results
    container.innerHTML = "";

    // If no fixtures data received
    if (!Array.isArray(fixtures)) {
        container.innerHTML = "<p>No upcoming fixtures available.</p>";
        return;
    }

    // If no upcoming matches found
    if (fixtures.length === 0) {
        container.innerHTML = "<p>No upcoming fixtures found.</p>";
        return;
    }

    // Display each fixture
    fixtures.forEach(f => {
        const div = document.createElement("div");
        div.classList.add("feed-card");

        div.innerHTML = `
            <p><strong>${f.home} vs ${f.away}</strong></p>
            <p>Round: ${f.round}</p>
            <p>Date: ${new Date(f.date).toLocaleDateString()}</p>
        `;

        container.appendChild(div);
    });
});


// LOAD PROFILE PAGE (Shows user's own posts)
async function loadProfile() {

    // Load current logged-in user (username)
    await loadCurrentUser();

    // Display profile header
    document.getElementById("profile-info").innerHTML = `
        <h3>@${currentUsername}</h3>
        <p>Your uploaded posts</p>
    `;

    // Fetch ONLY posts created by this user
    const res = await fetch(`/M01034045/contents/user/${currentUsername}`);
    const posts = await res.json();

    const container = document.getElementById("profile-posts");
    container.innerHTML = ""; // Clear before inserting

    // If the user has no posts yet
    if (posts.length === 0) {
        container.innerHTML = "<p>You haven’t posted anything yet.</p>";
        return;
    }

    // Loop through user's posts and show them
    posts.forEach(post => {
        const div = document.createElement("div");
        div.classList.add("profile-post-card");

        div.innerHTML = `
            <img src="/uploads/${post.image}" class="feed-image">
            <p>${post.caption}</p>

            <!-- Delete button for THIS post -->
            <button class="delete-btn" data-id="${post._id}">
                Delete Post
            </button>
        `;

        container.appendChild(div);
    });
}

// Store ID of post we are trying to delete
let pendingDeletePostId = null;

// When ANY delete button is clicked
document.addEventListener("click", (e) => {

    // Ignore other clicks
    if (!e.target.classList.contains("delete-btn")) return;

    // Get post ID from the clicked button
    pendingDeletePostId = e.target.dataset.id;

    // Show our custom delete modal
    document.getElementById("delete-modal").classList.remove("hidden");
});


// CANCEL DELETE (close modal)
document.getElementById("delete-cancel-btn").addEventListener("click", () => {
    document.getElementById("delete-modal").classList.add("hidden");
    pendingDeletePostId = null; // clear stored ID
});


// CONFIRM DELETE
document.getElementById("delete-confirm-btn").addEventListener("click", async () => {

    // If somehow button pressed without an ID stored
    if (!pendingDeletePostId) return;

    // Send delete request
    const res = await fetch("/M01034045/contents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: pendingDeletePostId })
    });

    // If deleted successfully
    if (res.ok) {
        // Hide modal
        document.getElementById("delete-modal").classList.add("hidden");

        // Reload profile posts
        loadProfile();
    }

    // Clear stored ID
    pendingDeletePostId = null;
});








