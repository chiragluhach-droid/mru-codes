-- Database-level guard for teacher accounts (applied 2026-11-19).
-- A profile may only have role 'teacher' if its email is in public.faculty_emails;
-- any other attempt is rejected (not silently turned into a student). This holds
-- even for writes that bypass the app (e.g. an old deployment on the same database).
-- Keep public.faculty_emails in sync with lib/faculty.ts (re-run this file after editing it).

CREATE TABLE IF NOT EXISTS public.faculty_emails (email TEXT PRIMARY KEY);
ALTER TABLE public.faculty_emails ENABLE ROW LEVEL SECURITY;

DELETE FROM public.faculty_emails;
INSERT INTO public.faculty_emails (email) VALUES
  ('aartikaushik@mru.edu.in'),
  ('abhisheksaxena@mru.edu.in'),
  ('agha@mru.edu.in'),
  ('anjalimehta@mru.edu.in'),
  ('annumishra@mru.edu.in'),
  ('anup@mru.edu.in'),
  ('anupriya@mru.edu.in'),
  ('ashimagarg.cst@mru.edu.in'),
  ('babitayadav@mru.edu.in'),
  ('bhawanasrivastava@mru.edu.in'),
  ('chandnimagoo@mru.edu.in'),
  ('chandrashekharkothari@mru.edu.in'),
  ('chiragchehak@gmail.com'),
  ('deepanshi@mru.edu.in'),
  ('deepikapahuja@mru.edu.in'),
  ('deeptithakral@mru.edu.in'),
  ('dimplesaproo@mru.edu.in'),
  ('dipalibansal@mru.edu.in'),
  ('divyanshusinha@mru.edu.in'),
  ('eshakhanna@mru.edu.in'),
  ('gangasharma@mru.edu.in'),
  ('gunjan@mru.edu.in'),
  ('gunjanaggarwal@mru.edu.in'),
  ('hodcst@mru.edu.in'),
  ('juhipruthi@mru.edu.in'),
  ('jyotinanwal@mru.edu.in'),
  ('maheshswami@mru.edu.in'),
  ('mamta@mru.edu.in'),
  ('manoj@mru.edu.in'),
  ('manpreet@mru.edu.in'),
  ('meena@mru.edu.in'),
  ('mrinal@mru.edu.in'),
  ('narender@mru.edu.in'),
  ('neelu@mru.edu.in'),
  ('parneeta.cst@mru.edu.in'),
  ('poojaahuja.cst@mru.edu.in'),
  ('prinima@mru.edu.in'),
  ('punamrattan@mru.edu.in'),
  ('pushpa@mru.edu.in'),
  ('ram@mru.edu.in'),
  ('ranjnajain@mru.edu.in'),
  ('raviprakashchaturvedi@mru.edu.in'),
  ('roshisaxena@mru.edu.in'),
  ('sachin@mru.edu.in'),
  ('sanjaysingh@mru.edu.in'),
  ('shalu@mru.edu.in'),
  ('simple@mru.edu.in'),
  ('sujata@mru.edu.in'),
  ('tamannasachdeva@mru.edu.in'),
  ('urmila@mru.edu.in');

CREATE OR REPLACE FUNCTION public.enforce_teacher_allowlist() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'teacher'
     AND NOT EXISTS (SELECT 1 FROM public.faculty_emails f WHERE f.email = lower(NEW.email)) THEN
    RAISE EXCEPTION 'This email is not registered as a teacher'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_teacher_allowlist ON public.profiles;
CREATE TRIGGER profiles_enforce_teacher_allowlist
  BEFORE INSERT OR UPDATE OF role, email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_teacher_allowlist();
