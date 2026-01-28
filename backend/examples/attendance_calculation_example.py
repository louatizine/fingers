"""
Attendance Calculation Example
Demonstrates how the attendance worked hours calculation works
"""

from datetime import datetime


def calculate_worked_hours_example():
    """
    Example calculation based on the business rules
    """
    
    # Example 1: Full day with lunch break
    print("=" * 60)
    print("EXAMPLE 1: Full Day with Lunch Break")
    print("=" * 60)
    
    check_in = datetime(2026, 1, 21, 8, 30)  # 08:30 AM
    check_out = datetime(2026, 1, 21, 17, 15)  # 05:15 PM
    lunch_start = datetime(2026, 1, 21, 12, 0)  # 12:00 PM
    lunch_end = datetime(2026, 1, 21, 13, 0)  # 01:00 PM
    
    print(f"Check-in:  {check_in.strftime('%H:%M')}")
    print(f"Check-out: {check_out.strftime('%H:%M')}")
    print(f"Lunch:     {lunch_start.strftime('%H:%M')} - {lunch_end.strftime('%H:%M')}")
    
    # Calculate total hours
    total_time = check_out - check_in
    total_hours = total_time.total_seconds() / 3600
    
    # Check if worked across lunch
    worked_across_lunch = check_in < lunch_end and check_out > lunch_start
    lunch_duration = 1.0 if worked_across_lunch else 0.0
    
    # Calculate worked hours
    worked_hours = total_hours - lunch_duration
    
    print(f"\nTotal hours:       {total_hours:.2f} hours")
    print(f"Lunch break:       {lunch_duration:.2f} hours")
    print(f"Worked hours:      {worked_hours:.2f} hours")
    print(f"Status:            Complete ✓")
    
    # Example 2: Half day (no lunch break)
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Half Day (Before Lunch)")
    print("=" * 60)
    
    check_in = datetime(2026, 1, 21, 8, 0)  # 08:00 AM
    check_out = datetime(2026, 1, 21, 11, 30)  # 11:30 AM
    
    print(f"Check-in:  {check_in.strftime('%H:%M')}")
    print(f"Check-out: {check_out.strftime('%H:%M')}")
    print(f"Lunch:     {lunch_start.strftime('%H:%M')} - {lunch_end.strftime('%H:%M')}")
    
    # Calculate total hours
    total_time = check_out - check_in
    total_hours = total_time.total_seconds() / 3600
    
    # Check if worked across lunch
    worked_across_lunch = check_in < lunch_end and check_out > lunch_start
    lunch_duration = 1.0 if worked_across_lunch else 0.0
    
    # Calculate worked hours
    worked_hours = total_hours - lunch_duration
    
    print(f"\nTotal hours:       {total_hours:.2f} hours")
    print(f"Lunch break:       {lunch_duration:.2f} hours (not deducted)")
    print(f"Worked hours:      {worked_hours:.2f} hours")
    print(f"Status:            Complete ✓")
    
    # Example 3: Afternoon shift (after lunch)
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Afternoon Shift (After Lunch)")
    print("=" * 60)
    
    check_in = datetime(2026, 1, 21, 13, 30)  # 01:30 PM
    check_out = datetime(2026, 1, 21, 18, 0)  # 06:00 PM
    
    print(f"Check-in:  {check_in.strftime('%H:%M')}")
    print(f"Check-out: {check_out.strftime('%H:%M')}")
    print(f"Lunch:     {lunch_start.strftime('%H:%M')} - {lunch_end.strftime('%H:%M')}")
    
    # Calculate total hours
    total_time = check_out - check_in
    total_hours = total_time.total_seconds() / 3600
    
    # Check if worked across lunch
    worked_across_lunch = check_in < lunch_end and check_out > lunch_start
    lunch_duration = 1.0 if worked_across_lunch else 0.0
    
    # Calculate worked hours
    worked_hours = total_hours - lunch_duration
    
    print(f"\nTotal hours:       {total_hours:.2f} hours")
    print(f"Lunch break:       {lunch_duration:.2f} hours (not deducted)")
    print(f"Worked hours:      {worked_hours:.2f} hours")
    print(f"Status:            Complete ✓")
    
    # Example 4: Long day (overtime)
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Long Day with Overtime")
    print("=" * 60)
    
    check_in = datetime(2026, 1, 21, 7, 30)  # 07:30 AM
    check_out = datetime(2026, 1, 21, 19, 0)  # 07:00 PM
    
    print(f"Check-in:  {check_in.strftime('%H:%M')}")
    print(f"Check-out: {check_out.strftime('%H:%M')}")
    print(f"Lunch:     {lunch_start.strftime('%H:%M')} - {lunch_end.strftime('%H:%M')}")
    
    # Calculate total hours
    total_time = check_out - check_in
    total_hours = total_time.total_seconds() / 3600
    
    # Check if worked across lunch
    worked_across_lunch = check_in < lunch_end and check_out > lunch_start
    lunch_duration = 1.0 if worked_across_lunch else 0.0
    
    # Calculate worked hours
    worked_hours = total_hours - lunch_duration
    
    print(f"\nTotal hours:       {total_hours:.2f} hours")
    print(f"Lunch break:       {lunch_duration:.2f} hours")
    print(f"Worked hours:      {worked_hours:.2f} hours")
    print(f"Standard hours:    8.00 hours")
    print(f"Overtime:          {max(0, worked_hours - 8):.2f} hours")
    print(f"Status:            Complete ✓")
    
    # Example 5: Missing check-out
    print("\n" + "=" * 60)
    print("EXAMPLE 5: Incomplete Day (Missing Check-out)")
    print("=" * 60)
    
    check_in = datetime(2026, 1, 21, 8, 30)  # 08:30 AM
    check_out = None
    
    print(f"Check-in:  {check_in.strftime('%H:%M')}")
    print(f"Check-out: Missing")
    
    print(f"\nWorked hours:      0.00 hours")
    print(f"Status:            Incomplete ✗")
    print(f"Action:            Employee needs to check out")
    
    print("\n" + "=" * 60)
    print("CALCULATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    calculate_worked_hours_example()
