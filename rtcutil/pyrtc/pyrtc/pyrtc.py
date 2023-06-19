import rv3028
import time
import datetime
import argparse

def main():
    parser = argparse.ArgumentParser(description='Interact with RTC')
    # Add the positional arguments
    parser.add_argument('action', choices=['timeset', 'timeget'], help='Action to perform (timeset or timeget)')

    # Parse the command-line arguments
    args = parser.parse_args()

    # Perform the action based on the provided argument
    if args.action == 'timeset':
        timeset()
    elif args.action == 'timeget':
        timeget()


def timeset():
    rtc = get_rtc()
    current_system_time = datetime.datetime.now()
    # Time and date may also be set as a tuple (hour, minute, second, year, month, date)
    rtc.set_time_and_date(current_system_time)


def timeget():
    rtc = get_rtc()
    rtc_time = rtc.get_time_and_date()
    print("The time is: {:02d}:{:02d}:{:02d} on :{:02d}/{:02d}/{:02d}".format(rtc_time.hour, rtc_time.minute, rtc_time.second, rtc_time.day, rtc_time.month, rtc_time.year))

def get_rtc():
    # Create RV3028 instance
    rtc = rv3028.RV3028()
    # Switches RTC to backup battery if VCC goes below 2V
    # Other settings: 'switchover_disabled', 'direct_switching_mode', 'standby_mode'
    rtc.set_battery_switchover('level_switching_mode')
    return rtc