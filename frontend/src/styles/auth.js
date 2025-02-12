import { css } from "/vendor/lit-core.min.js";

export const authStyles = css`
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
    background: var(--background-color);
  }

  .auth-card {
    width: 100%;
    max-width: 400px;
    padding: var(--spacing-xl);
  }

  h1 {
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--text-color);
    margin: 0 0 var(--spacing-xs);
    text-align: center;
  }

  .auth-subtitle {
    color: var(--text-secondary);
    text-align: center;
    margin-bottom: var(--spacing-lg);
  }

  .form-group {
    margin-bottom: var(--spacing-md);
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }

  .remember-me {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-secondary);
    cursor: pointer;
  }

  .forgot-password {
    color: var(--primary-color);
    text-decoration: none;
    font-size: var(--text-sm);
    transition: color var(--transition-normal);
  }

  .forgot-password:hover {
    color: var(--primary-dark);
  }

  .terms {
    display: block;
    color: var(--text-secondary);
    font-size: var(--text-sm);
    margin-bottom: var(--spacing-md);
  }

  .terms input {
    margin-right: var(--spacing-xs);
  }

  .terms a {
    color: var(--primary-color);
    text-decoration: none;
    transition: color var(--transition-normal);
  }

  .terms a:hover {
    color: var(--primary-dark);
  }

  .auth-footer {
    margin-top: var(--spacing-lg);
    text-align: center;
    color: var(--text-secondary);
  }

  .auth-footer a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: var(--font-medium);
    transition: color var(--transition-normal);
  }

  .auth-footer a:hover {
    color: var(--primary-dark);
  }

  .error-message {
    background: var(--error-color);
    color: white;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
    font-size: var(--text-sm);
  }

  @media (max-width: 480px) {
    .auth-card {
      padding: var(--spacing-lg);
    }

    .form-actions {
      flex-direction: column;
      gap: var(--spacing-sm);
      align-items: flex-start;
    }
  }
`;
