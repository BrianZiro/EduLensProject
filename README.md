# EduLensProject
EduLens AI is an AI-powered platform that tracks and analyzes educational performance in rural schools. It provides actionable insights through dashboards, alerts, and reports to support better decision-making for educators, parents, and policymakers.

# ⚙️ Installation & Setup

## 1. Clone the repository

        git clone https://github.com/username/project-name.git

        cd project-name

## 2. Create Your Own Branch

It’s best practice not to work directly on the main (or master) branch.

        git checkout -b your-branch-name

-replace "your-branch-name" with the branch of your own in the format : my-branch

Example:

        git checkout -b frontend-dev

## 3.Create and activate a virtual environment

### creating

        python -m venv venv 

### activating

#### Windows (Git Bash)

        source venv/Scripts/activate

#### Mac/Linux

        source venv/bin/activate

## 4. Work on Your Code

Make your changes (e.g., Django models, templates, etc.).

#### Database migrations

Since this is Django, you could add:

        python manage.py makemigrations

        python manage.py migrate

before running the server, so first-time setup is smooth.

Run and test locally before committing.

#### Run the development server

        python manage.py runserver


### N/B: before pushing anything setup .gitignore file to ignore venv(i have already done that for you)

## 5. Commit Your Work

        git add .

        git commit -m "styled frontend"

-the above is an example

## 6. Push to GitHub

        git push origin your-branch-name

## 7. Create a Pull Request (PR)

  -Go to GitHub repo in the browser.

  -GitHub will detect your branch and suggest "Compare & pull request".

  -Write a short description of what you did.

  -Submit the PR for the project owner/reviewers to check.

## 8. Keep Your Local Repo Updated

  -Always pull latest changes from main before starting new work:

#### a. Make sure you’re on your branch

        git checkout your-branch-name

#### b. Update your local main

  -Switch to main and pull the latest changes:

        git checkout main

        git pull origin main

#### c. Go back to your branch

        git checkout your-branch-name

#### d. Merge 

  -Merge main into your branch (simpler, creates a merge commit):

        git merge main

#### e. Push updated branch to GitHub

        git push origin your-branch-name


✅ Now your branch has all the latest changes from main.