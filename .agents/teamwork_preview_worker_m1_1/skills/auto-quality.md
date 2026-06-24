# auto-quality Skill
Silent quality check after every feature. Fix issues before telling user. Never claim tests passed without running them.
version: 5.0.0
check_after_every_feature
silent_fix_if_minor
run_tests_if_framework_exists
claim_tests_passed_without_running => reject
announce_checking => silent
say_tests_failed => fix_first_then_report
