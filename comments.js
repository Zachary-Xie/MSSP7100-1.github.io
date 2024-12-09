class CommentSystem {
    constructor() {
        // GitHub configuration
        this.owner = 'YOUR_GITHUB_USERNAME';
        this.repo = 'YOUR_REPO_NAME';
        this.issuesApiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/issues`;
        
        this.setupCommentIcon();
        this.setupCommentPanel();
        this.loadComments();
        
        // Add message listener for OAuth callback
        window.addEventListener('message', (event) => {
            if (event.data.token) {
                localStorage.setItem('github_token', event.data.token);
                console.log('Successfully logged in with GitHub');
            }
        });
    }

    setupCommentIcon() {
        const icon = document.createElement('div');
        icon.className = 'comment-icon';
        icon.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path>
            </svg>
        `;
        icon.onclick = () => this.togglePanel();
        document.body.appendChild(icon);
    }

    setupCommentPanel() {
        const panel = document.createElement('div');
        panel.className = 'comment-panel';
        panel.innerHTML = `
            <h3>Comments</h3>
            <div class="comment-list"></div>
            <div class="comment-input">
                <textarea placeholder="Write your comment..."></textarea>
                <button onclick="commentSystem.addComment()">Submit</button>
                <a href="https://github.com/login/oauth/authorize?client_id=${YOUR_CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:3000/oauth/callback')}&scope=public_repo" 
                   class="github-login" id="github-login">
                   Login with GitHub to comment
                </a>
            </div>
        `;
        document.body.appendChild(panel);
        this.panel = panel;
    }

    togglePanel() {
        this.panel.classList.toggle('active');
    }

    async loadComments() {
        try {
            const pageUrl = window.location.pathname;
            // Find the corresponding issue
            const searchResponse = await fetch(
                `${this.issuesApiUrl}?labels=${encodeURIComponent(pageUrl)}`
            );
            const issues = await searchResponse.json();
            
            let issue = issues[0];
            if (!issue) {
                // Create a new issue if none exists
                issue = await this.createNewIssue(pageUrl);
            }
            
            // Get issue comments
            const commentsResponse = await fetch(issue.comments_url);
            const comments = await commentsResponse.json();
            
            this.displayComments(comments);
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    }

    async createNewIssue(pageUrl) {
        const response = await fetch(this.issuesApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.getGitHubToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: `Comments for ${pageUrl}`,
                body: `This issue is used to store comments for ${pageUrl}`,
                labels: [pageUrl]
            })
        });
        return await response.json();
    }

    displayComments(comments) {
        const list = this.panel.querySelector('.comment-list');
        list.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-user">
                    <img src="${comment.user.avatar_url}" alt="${comment.user.login}" class="avatar">
                    <span>${comment.user.login}</span>
                </div>
                <div class="comment-time">${new Date(comment.created_at).toLocaleString('en-US')}</div>
                <div class="comment-content">${this.markdownToHtml(comment.body)}</div>
            </div>
        `).join('');
    }

    markdownToHtml(markdown) {
        // Can use libraries like marked to convert markdown
        return markdown;
    }

    getGitHubToken() {
        // Get GitHub token from localStorage or cookie
        return localStorage.getItem('github_token');
    }

    async addComment() {
        const token = this.getGitHubToken();
        if (!token) {
            alert('Please login with GitHub first');
            return;
        }

        const textarea = this.panel.querySelector('textarea');
        const content = textarea.value.trim();
        if (!content) return;

        try {
            const pageUrl = window.location.pathname;
            const issues = await (await fetch(
                `${this.issuesApiUrl}?labels=${encodeURIComponent(pageUrl)}`
            )).json();

            const issue = issues[0];
            if (!issue) return;

            const response = await fetch(`${issue.comments_url}`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    body: content
                })
            });

            if (response.ok) {
                textarea.value = '';
                await this.loadComments();
            } else {
                console.error('Failed to add comment');
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    }
}

const commentSystem = new CommentSystem(); 