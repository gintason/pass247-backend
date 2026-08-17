#!/usr/bin/env bash
# Render build script.
#
# Set this as the Build Command in the Render dashboard:
#     ./build.sh
#
# Make it executable before committing, or Render cannot run it:
#     chmod +x build.sh && git add --chmod=+x build.sh

# Exit immediately on any failure. Without this a failed migration would be
# ignored and the app would deploy against a half-migrated database.
set -o errexit

echo "--> Installing dependencies"
pip install --upgrade pip
pip install -r requirements.txt

echo "--> Collecting static files"
python manage.py collectstatic --no-input

echo "--> Running migrations"
python manage.py migrate --no-input

echo "--> Build complete"

# NOTE: no superuser is created here. Doing so would need credentials in
# environment variables, and the command would re-run on every deploy.
# Create one once from the Render shell instead:
#     python manage.py reatesuperuser
