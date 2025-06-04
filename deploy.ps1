# Define variables
$EC2_USER = "ec2-user"
$EC2_HOST = "ec2-54-184-116-169.us-west-2.compute.amazonaws.com"
$EC2_KEY_PATH = "ChrisWebDevBookAPIKey.pem"
$HOME_DIR = "/home/ec2-user/"
$PROJECT_DIR = "speedscore-backend"
$BRANCH = "ch24"
$SERVICE_NAME = "speedscore"

# Set the correct permissions on the private key file
icacls $EC2_KEY_PATH /inheritance:r
icacls $EC2_KEY_PATH /remove:g "BUILTIN\Users"
icacls $EC2_KEY_PATH /grant:r "$($env:USERNAME):(R)"

# SSH into the EC2 instance and run the deployment commands
$sshCommand = "cd $HOME_DIR; " +
              "cd $PROJECT_DIR; " +
              "pwd; " +
              "git pull origin $BRANCH || { echo 'Git pull failed'; exit 1; }; " +
              "npm install || { echo 'npm install failed'; exit 1; }; " +
              "sudo systemctl restart $SERVICE_NAME || { echo 'Failed to restart service'; exit 1; }; " +
              "echo 'Deployment completed successfully'"

# Execute the SSH command
ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST "bash -c `"$sshCommand`""