CREATE PACKAGE world AS 
  /**
   * Find a person by ID.
   *
   * @param people.id%type Person identifier
   */
  PROCEDURE find_person(p_id people.id%TYPE); 
  /**
   * Add an activity for the given person.
   *
   * @param people.id%type Person identifier
   */
  PROCEDURE add_activity(p_id people.id%TYPE); 
END world; 
/

CREATE OR REPLACE PACKAGE BODY world AS  
  PROCEDURE find_person(p_id people.id%TYPE) IS
    v_name people.name%TYPE; 
  BEGIN 
    SELECT name INTO v_name
    FROM schema.view_active_employees
    WHERE id = p_id; 

    DBMS_OUTPUT.put_line('Name: '|| v_name); 
  END find_person; 

  PROCEDURE add_activity(p_id people.id%TYPE) IS
    -- Activity Cursor
    CURSOR c_activity IS
    SELECT * FROM activity@auditory
    WHERE owner_id = p_id
    ORDER BY created_at DESC
    LIMIT 2;
  BEGIN 
    OPEN c_activity;
    LOOP
      FETCH c_activity INTO r_activity;
      EXIT WHEN c_activity%NOTFOUND;

      -- Block the user if the activit
      INSERT INTO schema.activity
        (person_id, created_at)
      VALUES
        (r_activity.owner_id, r_activity.created_at);

      DBMS_OUTPUT.PUT_LINE('Person: '||r_activity.owner_id|| ' Date: '||r_activity.created_at);
    END LOOP;
    CLOSE c_activity;
  END add_activity; 
END world; 
/
