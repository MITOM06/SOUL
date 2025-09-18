export interface DemoUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
}

// A small set of sample users for the admin UI. In a real application
// these records would come from your backend via an API call. You can
// expand this array as needed for testing purposes.
export const demoUsers: DemoUser[] = [
  { id: 1, name: 'Alice Nguyen', email: 'alice@example.com', role: 'user', status: 'active' },
  { id: 2, name: 'Bob Tran', email: 'bob@example.com', role: 'user', status: 'active' },
  { id: 3, name: 'Charlie Pham', email: 'charlie@example.com', role: 'admin', status: 'active' },
  { id: 4, name: 'Diana Le', email: 'diana@example.com', role: 'user', status: 'blocked' }
];