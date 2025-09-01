#!/usr/bin/env python3
"""
Migration script to add new fields to the questions table for programming questions
"""
import sqlite3
import os

def migrate_database():
    """Add new fields to the questions table"""
    
    # Database path
    db_path = "data/learnpath.db"
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(lp_questions)")
        columns = [column[1] for column in cursor.fetchall()]
        
        print("Current columns in lp_questions table:")
        for column in columns:
            print(f"  - {column}")
        
        # Add question_type column if it doesn't exist
        if 'question_type' not in columns:
            print("Adding question_type column...")
            cursor.execute("ALTER TABLE lp_questions ADD COLUMN question_type VARCHAR(50)")
            print("✓ Added question_type column")
        else:
            print("✓ question_type column already exists")
        
        # Add code_snippet column if it doesn't exist
        if 'code_snippet' not in columns:
            print("Adding code_snippet column...")
            cursor.execute("ALTER TABLE lp_questions ADD COLUMN code_snippet TEXT")
            print("✓ Added code_snippet column")
        else:
            print("✓ code_snippet column already exists")
        
        # Commit changes
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Verify the new structure
        cursor.execute("PRAGMA table_info(lp_questions)")
        new_columns = [column[1] for column in cursor.fetchall()]
        
        print("\nUpdated columns in lp_questions table:")
        for column in new_columns:
            print(f"  - {column}")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Starting database migration for programming questions...")
    migrate_database()
