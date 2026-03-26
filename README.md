# Project 724

# Entities
> [!NOTE]
> ATTRIBUTE **→** VALUE
> is read ATTRIBUTE as VALUE

### Resident:
* Id : (int)
* FirstName : (string)
* MiddleName : (string)
* LastName : (string)
* Suffix : (string)
* BirthDate : (DateOnly)
* Age : (int)
* Sector : (int)
    * General → 0
    * Senior → 1
    * PWD → 2
* Sex : (int)
    * Male → 0
    * Female → 1
* CivilStatus : (int)
    * Single → 0
    * Married → 1
    * Widowed → 2
    * Divorced → 3
    * Annulled → 4
    * LegallySeparated → 5
* Address : (string)

# API

## Endpoints

### All Residents
* Endpoint: `GET /residents`

### Filter Residents
* Endpoint: `GET /residents/filter[?params]`
* Parameters:
|Parameter|Type|Required?|Default|Description|
|`minAge`|int|no|null|Returns residents with ages above set value|
|`maxAge`|int|no|null|Returns residents with ages below set value|
|`sex`|string\|int|no|null|Filter by sex, pass multiple values as `sex=male&sex=female`|
|`sector`|string\|int|no|null|Filter by sector or vulnerability, pass multiple values as `sector=pwd&sector=senior`|
|`civilStat`|string\|int|no|null|Filter by civil status, pass multiple values as `civilStat=single&civilStat=married`|
|`from`|int|no|0|The starting index of entries to return base on `orderBy`|
|`limit`|int|no|50|The max number of entries to return base on `orderBy`|

### Add Resident
* Endpoint: `POST /residents}`
* Request Body: (to be added)
* Response Body: (to be added)

### Update Resident
* Endpoint: `PUT /residents/{id}`
* Request Body: (to be added)
* Response Body: (to be added)

### Remove Resident
* Endpoint: `DELETE /residents/{id}`
* Request Body: (to be added)
* Response Body: (to be added)
