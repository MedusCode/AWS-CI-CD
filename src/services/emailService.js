import sgMail from '@sendgrid/mail';

/***********************************************************************
 * sendVerificationEmail
 * @descr Send a verification email to the user.
 * @param {string} email - The email address to send the verification email to.
 * @param {string} verificationToken - The token to verify the user.
 * @returns {Promise<void>}
 * @throws {Error} If the email fails to send.
 *************************************************************************/
export const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.API_DEPLOYMENT_URL}/auth/verify-email/${verificationToken}`;
  const message = {
    to: email,
    from: process.env.SENDGRID_FROM_ADDRESS, 
    subject: 'SpeedScore: Verify Your Email Address',
    text: `Please use the following link to verify ` +
            `your email address: ${verificationUrl}`,
    html: `<p>Please click on the following link to verify ` +
            `your email address:` +
        `<a href="${verificationUrl}">Verify Email</a></p>`
  };
  await sgMail.send(message);
};

/***********************************************************************
 * sendPasswordResetEmail
 * @descr Send a password reset email to the user.
 * @param {string} email - The email address to send the password reset email to.
 * @param {string} resetCode - The code to reset the user's password.
 * @returns {Promise<void>}
 * @throws {Error} If the email fails to send.
 *************************************************************************/
 export const sendPasswordResetEmail = async (email, resetCode) => {
  const message = {
    to: email,
    from: process.env.SENDGRID_FROM_ADDRESS,
    subject: 'SpeedScore: Password Reset Code',
    text: `Your password reset code is: ${resetCode}`,
    html: `<p>Your password reset code is: <strong>${resetCode}</strong></p>`
  };
  await sgMail.send(message);
};