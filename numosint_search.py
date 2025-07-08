import subprocess
import csv
import os
import argparse

# Parameters
domains = ["@gmail.com", "@yahoo.com", "@hotmail.com", "@outlook.com"]

# Command line arguments parsing
parser = argparse.ArgumentParser()
parser.add_argument('search_term', nargs='+', help='First name, last name, or string to search for')
parser.add_argument('-B', action='store_true', help='Option -B to generate only specified domain addresses')
args = parser.parse_args()

# Check the validity of the search term
search_term = ' '.join(args.search_term)
if not search_term.replace(' ', '').isalpha():
    print("Error: The search term must contain only alphabetical letters.")
    exit()

# Function to generate probable email addresses
def generate_addresses(search_term, domains):
    addresses = []
    first_name, last_name = search_term.split(' ', 1)

    for domain in domains:
        email_formats = [
            first_name.lower() + '.' + last_name.lower() + domain,
            first_name.lower()[0] + last_name.lower() + domain,
            first_name.lower() + last_name.lower()[0] + domain,
            first_name.lower()[0] + '.' + last_name.lower() + domain,
            last_name.lower() + '.' + first_name.lower() + domain,
            last_name.lower() + first_name.lower()[0] + domain,
            last_name.lower()[0] + '.' + first_name.lower() + domain,
            first_name.lower() + last_name.lower() + domain,
            last_name.lower() + first_name.lower() + domain,
            first_name.lower() + '.' + last_name.lower()[0] + domain,
            first_name.lower() + '_' + last_name.lower()[0] + domain,  # Added format with underscore
            first_name.lower()[0] + '_' + last_name.lower() + domain,  # Added format with underscore
            first_name.lower() + '_' + last_name.lower() + domain,      # Added format with underscore
            last_name.lower() + '_' + first_name.lower() + domain,      # Added format with underscore
            last_name.lower() + '_' + first_name.lower()[0] + domain,   # Added format with underscore
            last_name.lower()[0] + '_' + first_name.lower() + domain,   # Added format with underscore
        ]

        addresses.extend(email_formats)

    return addresses

# Generate probable email addresses based on the search term
email_addresses = generate_addresses(search_term, domains)

# Check if the -B option is specified to filter addresses by domain name
if args.B:
    domain = input("Enter the domain name: ")
    email_addresses = [address for address in email_addresses if address.endswith(domain)]

# Create directory structure
first_name, last_name = search_term.split(' ', 1)
reports_dir = "reports"
search_dir = f"{first_name}-{last_name}"
full_path = os.path.join(reports_dir, search_dir)

# Create reports directory if it doesn't exist
os.makedirs(reports_dir, exist_ok=True)
# Create search-specific directory
os.makedirs(full_path, exist_ok=True)

# Execute the command to test each email address
for address in email_addresses:
    command_holehe = f"cd {full_path} && holehe {address} -C"
    subprocess.run(command_holehe, shell=True)
    directory = os.path.join(os.getcwd(), full_path)

# List to store valid file names
valid_files = []

# Iterate through all files in the directory
for file in os.listdir(directory):
    if file.endswith(".csv") and file.startswith("holehe_"):
        # Add the valid file name to the list
        valid_files.append(file)

# Output file path
output_path = os.path.join(directory, 'main.csv')

# Open the output file in write mode
with open(output_path, 'w', newline='') as csvfile:
    writer = None

    # Iterate through valid files
    for file in valid_files:
        # CSV file path
        file_path = os.path.join(directory, file)

        # Extract email address from the file name
        email_address = file.split("_")[2]

        # Open the CSV file in read mode
        with open(file_path, newline='') as csvfile_in:
            reader = csv.DictReader(csvfile_in)
            fieldnames = reader.fieldnames

            # Add the 'email address' column in the first position
            fieldnames.insert(0, 'email address')

            # Create the writer if not already done
            if writer is None:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()

            # Read each row from the CSV file and write it to the output file with the corresponding email address
            for row in reader:
                row['email address'] = email_address
                writer.writerow(row)

print(f"Successfully generated main.csv file in {full_path}/main.csv")
print(f"Report directory: {full_path}")
