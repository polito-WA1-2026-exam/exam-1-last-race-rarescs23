/** dao-users.js — DAO for user authentication **/

import crypto from "crypto";
import db from "./db.js";

/** Returns the user with the given email if the password is correct,
 * otherwise returns false.
 */
export const getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM user WHERE email = ?";
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        // user does not exist
        resolve(false);
      } else {
        // verify the password using crypto.scrypt
        crypto.scrypt(password, row.salt, 32, (err, hashedBuffer) => {
          if (err) {
            reject(err);
          } else {
            const storedBuffer = Buffer.from(row.password, "hex");
            const match = crypto.timingSafeEqual(storedBuffer, hashedBuffer);
            if (match) {
              resolve({ id: row.id, email: row.email, name: row.name });
            } else {
              resolve(false);
            }
          }
        });
      }
    });
  });
};

/**
 * Returns the user by id (used by Passport deserializeUser).
 */
export const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT id, email, name FROM user WHERE id = ?";
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else resolve({ id: row.id, email: row.email, name: row.name });
    });
  });
};
