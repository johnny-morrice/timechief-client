import rv3028
import datetime
import argparse
import subprocess
import sys

def main():
    parser = argparse.ArgumentParser(description='Interact with RTC')
    # Add the positional arguments
    parser.add_argument('action', choices=['timeset', 'timeget', 'timesync'], help='Action to perform (timeset or timeget)')
    parser.add_argument('--type', choices=['rv3028'], help='RTC type (rv3028)')
    parser.add_argument('--sync-script', default='/opt/timechief-launcher/bin/secure/set-system-time.sh', help='Path to time sync script')

    # Parse the command-line arguments
    args = parser.parse_args()

    if args.type == 'rv3028':
        pass
    else:
        print('Unknown RTC type: {}'.format(args.type))
        sys.exit(1)

    # Perform the action based on the provided argument
    if args.action == 'timeset':
        timeset(args)
    elif args.action == 'timeget':
        timeget(args)
    elif args.action == 'timesync':
        timesync(args)
    else:
        print('Unknown action: {}'.format(args.action))
        sys.exit(1)


def timeset(args):
    rtc = get_rtc()
    current_system_time = datetime.datetime.now()
    # Time and date may also be set as a tuple (hour, minute, second, year, month, date)
    rtc.set_time_and_date(current_system_time)


def timeget(args):
    rtc = get_rtc()
    rtc_time = rtc.get_time_and_date()
    print("The time is: {:02d}:{:02d}:{:02d} on: {:02d}/{:02d}/{:02d}".format(rtc_time.hour, rtc_time.minute, rtc_time.second, rtc_time.day, rtc_time.month, rtc_time.year))

def timesync(args):
    rtc = get_rtc()
    rtc_time = rtc.get_time_and_date()
    date_string = f"{rtc_time.year:04d}-{rtc_time.month:02d}-{rtc_time.day:02d}T{rtc_time.hour:02d}:{rtc_time.minute:02d}:{rtc_time.second:02d}Z"
    subprocess.run([args.sync_script, date_string])

def get_rtc():
    # Create RV3028 instance
    rtc = rv3028.RV3028()
    # Switches RTC to backup battery if VCC goes below 2V
    # Other settings: 'switchover_disabled', 'direct_switching_mode', 'standby_mode'
    rtc.set_battery_switchover('level_switching_mode')
    return rtc